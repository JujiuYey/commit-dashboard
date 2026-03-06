package repository

import (
	"context"
	"fmt"

	"github.com/uptrace/bun"

	gitea_db "sag-reg-server/app/gitea/models/db"
)

// ContributorRepository 贡献者数据访问
type ContributorRepository struct {
	db *bun.DB
}

// NewContributorRepository 创建贡献者数据访问实例
func NewContributorRepository(db *bun.DB) *ContributorRepository {
	return &ContributorRepository{db: db}
}

// RebuildFromCommits 从提交记录重新聚合贡献者数据
func (r *ContributorRepository) RebuildFromCommits(ctx context.Context) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("开始事务失败: %w", err)
	}
	defer tx.Rollback()

	// 清空贡献者相关表
	if _, err := tx.NewDelete().Model((*gitea_db.ContributorRepoStats)(nil)).Where("1=1").Exec(ctx); err != nil {
		return fmt.Errorf("清空贡献者仓库统计失败: %w", err)
	}
	if _, err := tx.NewDelete().Model((*gitea_db.Contributor)(nil)).Where("1=1").Exec(ctx); err != nil {
		return fmt.Errorf("清空贡献者表失败: %w", err)
	}

	// 从 commits 聚合贡献者数据
	_, err = tx.NewRaw(`
		INSERT INTO contributors (email, name, total_commits, total_additions, total_deletions, first_commit_at, last_commit_at)
		SELECT
			author_email,
			MAX(author_name),
			COUNT(*),
			COALESCE(SUM(additions), 0),
			COALESCE(SUM(deletions), 0),
			MIN(committed_at),
			MAX(committed_at)
		FROM commits
		GROUP BY author_email
	`).Exec(ctx)
	if err != nil {
		return fmt.Errorf("聚合贡献者数据失败: %w", err)
	}

	// 聚合贡献者-仓库统计数据
	_, err = tx.NewRaw(`
		INSERT INTO contributor_repo_stats (contributor_id, repo_id, commits_count, additions, deletions, first_commit_at, last_commit_at)
		SELECT
			ct.id,
			c.repo_id,
			COUNT(*),
			COALESCE(SUM(c.additions), 0),
			COALESCE(SUM(c.deletions), 0),
			MIN(c.committed_at),
			MAX(c.committed_at)
		FROM commits c
		JOIN contributors ct ON ct.email = c.author_email
		GROUP BY ct.id, c.repo_id
	`).Exec(ctx)
	if err != nil {
		return fmt.Errorf("聚合贡献者仓库统计失败: %w", err)
	}

	return tx.Commit()
}

// List 分页查询贡献者列表
func (r *ContributorRepository) List(ctx context.Context, limit, offset int) ([]gitea_db.Contributor, int, error) {
	var contributors []gitea_db.Contributor

	query := r.db.NewSelect().Model(&contributors)

	total, err := query.Count(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("查询贡献者总数失败: %w", err)
	}

	err = query.
		Order("total_commits DESC").
		Limit(limit).
		Offset(offset).
		Scan(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("查询贡献者列表失败: %w", err)
	}

	return contributors, total, nil
}

// GetByID 根据 ID 获取贡献者详情
func (r *ContributorRepository) GetByID(ctx context.Context, id int) (*gitea_db.Contributor, error) {
	contributor := new(gitea_db.Contributor)
	err := r.db.NewSelect().
		Model(contributor).
		Where("id = ?", id).
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("获取贡献者失败: %w", err)
	}
	return contributor, nil
}

// GetRepoStatsByContributorID 获取贡献者的各仓库统计
func (r *ContributorRepository) GetRepoStatsByContributorID(ctx context.Context, contributorID int) ([]gitea_db.ContributorRepoStats, error) {
	var stats []gitea_db.ContributorRepoStats
	err := r.db.NewSelect().
		Model(&stats).
		Relation("Repository").
		Where("crs.contributor_id = ?", contributorID).
		Order("crs.commits_count DESC").
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("获取贡献者仓库统计失败: %w", err)
	}
	return stats, nil
}
