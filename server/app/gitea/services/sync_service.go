package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/uptrace/bun"

	gitea_db "sag-reg-server/app/gitea/models/db"
	gitea_res "sag-reg-server/app/gitea/models/response"
	"sag-reg-server/app/gitea/repository"
	gitea_client "sag-reg-server/infrastructure/gitea"
)

// SyncService 同步服务
type SyncService struct {
	repoRepo        *repository.RepoRepository
	commitRepo      *repository.CommitRepository
	contributorRepo *repository.ContributorRepository
}

// NewSyncService 创建同步服务实例
func NewSyncService(db *bun.DB) *SyncService {
	return &SyncService{
		repoRepo:        repository.NewRepoRepository(db),
		commitRepo:      repository.NewCommitRepository(db),
		contributorRepo: repository.NewContributorRepository(db),
	}
}

// SyncRepos 同步仓库列表
func (s *SyncService) SyncRepos(ctx context.Context, client *gitea_client.Client) (int, error) {
	giteaRepos, err := client.GetRepos()
	if err != nil {
		return 0, fmt.Errorf("获取 Gitea 仓库列表失败: %w", err)
	}

	for _, gr := range giteaRepos {
		repo := &gitea_db.Repository{
			GiteaID:         gr.ID,
			Owner:           gr.Owner.Login,
			Name:            gr.Name,
			FullName:        gr.FullName,
			Description:     gr.Description,
			DefaultBranch:   gr.DefaultBranch,
			StarsCount:      gr.StarsCount,
			ForksCount:      gr.ForksCount,
			OpenIssuesCount: gr.OpenIssuesCount,
			CreatedAt:       gr.CreatedAt,
			UpdatedAt:       gr.UpdatedAt,
		}
		if err := s.repoRepo.Upsert(ctx, repo); err != nil {
			log.Printf("同步仓库 %s 失败: %v", gr.FullName, err)
			continue
		}
	}

	return len(giteaRepos), nil
}

// SyncReposOnly 仅同步仓库列表
func (s *SyncService) SyncReposOnly(ctx context.Context, client *gitea_client.Client) (*gitea_res.SyncReposResult, error) {
	start := time.Now()
	synced, err := s.SyncRepos(ctx, client)
	if err != nil {
		return nil, err
	}
	return &gitea_res.SyncReposResult{
		SyncedRepos: synced,
		Duration:    fmt.Sprintf("%.1fs", time.Since(start).Seconds()),
	}, nil
}

// SyncCommits 同步提交记录
func (s *SyncService) SyncCommits(ctx context.Context, client *gitea_client.Client, repoIDs []int64) (*gitea_res.SyncResult, error) {
	start := time.Now()
	result := &gitea_res.SyncResult{}

	// 先同步仓库信息
	syncedRepos, err := s.SyncRepos(ctx, client)
	if err != nil {
		return nil, err
	}

	// 获取要同步的仓库列表
	var repos []gitea_db.Repository
	if len(repoIDs) > 0 {
		repos, err = s.repoRepo.GetByGiteaIDs(ctx, repoIDs)
	} else {
		repos, err = s.repoRepo.List(ctx)
	}
	if err != nil {
		return nil, fmt.Errorf("获取仓库列表失败: %w", err)
	}

	result.SyncedRepos = syncedRepos

	// 遍历仓库同步提交记录
	for _, repo := range repos {
		newCommits, err := s.syncRepoCommits(ctx, client, &repo)
		if err != nil {
			log.Printf("同步仓库 %s 的提交记录失败: %v", repo.FullName, err)
			continue
		}
		result.NewCommits += newCommits
	}

	// 重建贡献者统计数据
	if err := s.contributorRepo.RebuildFromCommits(ctx); err != nil {
		log.Printf("重建贡献者统计失败: %v", err)
	}

	result.Duration = fmt.Sprintf("%.1fs", time.Since(start).Seconds())
	return result, nil
}

// SyncRepoCommitsByID 同步指定 Gitea 仓库 ID 的提交记录
func (s *SyncService) SyncRepoCommitsByID(ctx context.Context, client *gitea_client.Client, giteaRepoID int64) (int, error) {
	repo, err := s.repoRepo.GetByGiteaID(ctx, giteaRepoID)
	if err != nil {
		return 0, fmt.Errorf("仓库不存在: %w", err)
	}
	return s.syncRepoCommits(ctx, client, repo)
}

// syncRepoCommits 同步单个仓库的提交记录
func (s *SyncService) syncRepoCommits(ctx context.Context, client *gitea_client.Client, repo *gitea_db.Repository) (int, error) {
	// 查询上次同步的最新 SHA，用于增量同步
	latestSHA, _ := s.commitRepo.GetLatestSHA(ctx, int(repo.ID))

	// 从 Gitea 获取提交记录（传入 latestSHA 实现增量）
	giteaCommits, err := client.GetRepoCommits(repo.Owner, repo.Name, repo.DefaultBranch, latestSHA)
	if err != nil {
		return 0, fmt.Errorf("获取提交记录失败: %w", err)
	}

	if len(giteaCommits) == 0 {
		return 0, nil
	}

	// 转换为数据库模型
	var commits []gitea_db.Commit
	for _, gc := range giteaCommits {
		commit := gitea_db.Commit{
			RepoID:         repo.ID,
			SHA:            gc.SHA,
			AuthorName:     gc.Commit.Author.Name,
			AuthorEmail:    gc.Commit.Author.Email,
			CommitterName:  gc.Commit.Committer.Name,
			CommitterEmail: gc.Commit.Committer.Email,
			Message:        gc.Commit.Message,
			CommittedAt:    gc.Commit.Author.Date,
		}
		if gc.Stats != nil {
			commit.Additions = gc.Stats.Additions
			commit.Deletions = gc.Stats.Deletions
			commit.TotalChanges = gc.Stats.Total
		}
		commits = append(commits, commit)
	}

	// 批量插入（忽略已存在的）
	inserted, err := s.commitRepo.BatchInsert(ctx, commits)
	if err != nil {
		return 0, err
	}

	log.Printf("仓库 %s: 获取 %d 条提交, 新增 %d 条", repo.FullName, len(giteaCommits), inserted)
	return inserted, nil
}
