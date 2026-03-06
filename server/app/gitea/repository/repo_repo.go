package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/uptrace/bun"

	gitea_db "sag-reg-server/app/gitea/models/db"
)

// RepoRepository 仓库数据访问
type RepoRepository struct {
	db *bun.DB
}

// NewRepoRepository 创建仓库数据访问实例
func NewRepoRepository(db *bun.DB) *RepoRepository {
	return &RepoRepository{db: db}
}

// Upsert 创建或更新仓库
func (r *RepoRepository) Upsert(ctx context.Context, repo *gitea_db.Repository) error {
	repo.SyncedAt = time.Now()
	_, err := r.db.NewInsert().
		Model(repo).
		On("CONFLICT (gitea_id) DO UPDATE").
		Set("owner = EXCLUDED.owner").
		Set("name = EXCLUDED.name").
		Set("full_name = EXCLUDED.full_name").
		Set("description = EXCLUDED.description").
		Set("default_branch = EXCLUDED.default_branch").
		Set("stars_count = EXCLUDED.stars_count").
		Set("forks_count = EXCLUDED.forks_count").
		Set("open_issues_count = EXCLUDED.open_issues_count").
		Set("updated_at = EXCLUDED.updated_at").
		Set("synced_at = EXCLUDED.synced_at").
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("upsert 仓库失败: %w", err)
	}
	return nil
}

// GetByGiteaID 根据 Gitea ID 获取仓库
func (r *RepoRepository) GetByGiteaID(ctx context.Context, giteaID int64) (*gitea_db.Repository, error) {
	repo := new(gitea_db.Repository)
	err := r.db.NewSelect().
		Model(repo).
		Where("gitea_id = ?", giteaID).
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("获取仓库失败: %w", err)
	}
	return repo, nil
}

// GetByID 根据 ID 获取仓库
func (r *RepoRepository) GetByID(ctx context.Context, id int) (*gitea_db.Repository, error) {
	repo := new(gitea_db.Repository)
	err := r.db.NewSelect().
		Model(repo).
		Where("id = ?", id).
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("获取仓库失败: %w", err)
	}
	return repo, nil
}

// List 获取所有仓库列表
func (r *RepoRepository) List(ctx context.Context) ([]gitea_db.Repository, error) {
	var repos []gitea_db.Repository
	err := r.db.NewSelect().
		Model(&repos).
		Order("full_name ASC").
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("获取仓库列表失败: %w", err)
	}
	return repos, nil
}

// GetByGiteaIDs 根据 Gitea ID 列表获取仓库
func (r *RepoRepository) GetByGiteaIDs(ctx context.Context, giteaIDs []int64) ([]gitea_db.Repository, error) {
	var repos []gitea_db.Repository
	err := r.db.NewSelect().
		Model(&repos).
		Where("gitea_id IN (?)", bun.In(giteaIDs)).
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("获取仓库列表失败: %w", err)
	}
	return repos, nil
}
