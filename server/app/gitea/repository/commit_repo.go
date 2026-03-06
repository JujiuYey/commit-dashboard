package repository

import (
	"context"
	"fmt"

	"github.com/uptrace/bun"

	gitea_db "sag-reg-server/app/gitea/models/db"
)

// CommitRepository 提交记录数据访问
type CommitRepository struct {
	db *bun.DB
}

// NewCommitRepository 创建提交记录数据访问实例
func NewCommitRepository(db *bun.DB) *CommitRepository {
	return &CommitRepository{db: db}
}

// BatchInsert 批量插入提交记录（忽略已存在的）
func (r *CommitRepository) BatchInsert(ctx context.Context, commits []gitea_db.Commit) (int, error) {
	if len(commits) == 0 {
		return 0, nil
	}

	result, err := r.db.NewInsert().
		Model(&commits).
		On("CONFLICT (sha) DO NOTHING").
		Exec(ctx)
	if err != nil {
		return 0, fmt.Errorf("批量插入提交记录失败: %w", err)
	}

	affected, _ := result.RowsAffected()
	return int(affected), nil
}

// List 分页查询提交记录
func (r *CommitRepository) List(ctx context.Context, repoID int, author string, startDate, endDate string, limit, offset int) ([]gitea_db.Commit, int, error) {
	var commits []gitea_db.Commit

	query := r.db.NewSelect().
		Model(&commits).
		Relation("Repository")

	if repoID > 0 {
		query = query.Where("c.repo_id = ?", repoID)
	}
	if author != "" {
		query = query.Where("c.author_email = ?", author)
	}
	if startDate != "" {
		query = query.Where("c.committed_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("c.committed_at <= ?", endDate)
	}

	total, err := query.Count(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("查询提交记录总数失败: %w", err)
	}

	err = query.
		Order("c.committed_at DESC").
		Limit(limit).
		Offset(offset).
		Scan(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("查询提交记录失败: %w", err)
	}

	return commits, total, nil
}

// GetTrend 获取提交趋势数据（按日期分组）
func (r *CommitRepository) GetTrend(ctx context.Context, repoID int, startDate, endDate string) ([]struct {
	Date    string `bun:"date"`
	Commits int    `bun:"commits"`
}, error) {
	var trend []struct {
		Date    string `bun:"date"`
		Commits int    `bun:"commits"`
	}

	query := r.db.NewSelect().
		TableExpr("commits AS c").
		ColumnExpr("TO_CHAR(c.committed_at, 'YYYY-MM-DD') AS date").
		ColumnExpr("COUNT(*) AS commits")

	if repoID > 0 {
		query = query.Where("c.repo_id = ?", repoID)
	}
	if startDate != "" {
		query = query.Where("c.committed_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("c.committed_at <= ?", endDate)
	}

	err := query.
		GroupExpr("TO_CHAR(c.committed_at, 'YYYY-MM-DD')").
		OrderExpr("date ASC").
		Scan(ctx, &trend)
	if err != nil {
		return nil, fmt.Errorf("查询提交趋势失败: %w", err)
	}

	return trend, nil
}

// GetHeatmap 获取活跃热力图数据（按星期和小时分组）
func (r *CommitRepository) GetHeatmap(ctx context.Context, repoID int) ([]struct {
	DayOfWeek int `bun:"day_of_week"`
	Hour      int `bun:"hour"`
	Count     int `bun:"count"`
}, error) {
	var heatmap []struct {
		DayOfWeek int `bun:"day_of_week"`
		Hour      int `bun:"hour"`
		Count     int `bun:"count"`
	}

	query := r.db.NewSelect().
		TableExpr("commits AS c").
		ColumnExpr("EXTRACT(DOW FROM c.committed_at)::int AS day_of_week").
		ColumnExpr("EXTRACT(HOUR FROM c.committed_at)::int AS hour").
		ColumnExpr("COUNT(*) AS count")

	if repoID > 0 {
		query = query.Where("c.repo_id = ?", repoID)
	}

	err := query.
		GroupExpr("day_of_week, hour").
		OrderExpr("day_of_week, hour").
		Scan(ctx, &heatmap)
	if err != nil {
		return nil, fmt.Errorf("查询热力图数据失败: %w", err)
	}

	return heatmap, nil
}

// GetStats 获取提交统计
func (r *CommitRepository) GetStats(ctx context.Context, repoID int) (totalCommits, totalAdditions, totalDeletions int, err error) {
	var stats struct {
		TotalCommits   int `bun:"total_commits"`
		TotalAdditions int `bun:"total_additions"`
		TotalDeletions int `bun:"total_deletions"`
	}

	query := r.db.NewSelect().
		TableExpr("commits AS c").
		ColumnExpr("COUNT(*) AS total_commits").
		ColumnExpr("COALESCE(SUM(c.additions), 0) AS total_additions").
		ColumnExpr("COALESCE(SUM(c.deletions), 0) AS total_deletions")

	if repoID > 0 {
		query = query.Where("c.repo_id = ?", repoID)
	}

	err = query.Scan(ctx, &stats)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("查询提交统计失败: %w", err)
	}

	return stats.TotalCommits, stats.TotalAdditions, stats.TotalDeletions, nil
}

// GetLatestSHA 获取仓库最新提交的 SHA
func (r *CommitRepository) GetLatestSHA(ctx context.Context, repoID int) (string, error) {
	var sha string
	err := r.db.NewSelect().
		TableExpr("commits").
		Column("sha").
		Where("repo_id = ?", repoID).
		Order("committed_at DESC").
		Limit(1).
		Scan(ctx, &sha)
	if err != nil {
		return "", nil // 没有记录，返回空
	}
	return sha, nil
}
