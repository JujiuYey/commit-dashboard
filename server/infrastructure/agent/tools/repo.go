package tools

import (
	"context"
	"fmt"
	"strings"

	"sag-reg-server/app/gitea/repository"
)

// RepoTools 仓库工具集
type RepoTools struct {
	repoRepo *repository.RepoRepository
}

// NewRepoTools 创建仓库工具集
func NewRepoTools(repoRepo *repository.RepoRepository) *RepoTools {
	return &RepoTools{repoRepo: repoRepo}
}

// ListRepos 查询仓库列表
func (t *RepoTools) ListRepos(ctx context.Context, params map[string]interface{}) (string, error) {
	repos, err := t.repoRepo.List(ctx)
	if err != nil {
		return "", fmt.Errorf("查询仓库列表失败: %w", err)
	}

	if len(repos) == 0 {
		return "没有找到已同步的仓库。请先同步数据。", nil
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("共 %d 个已同步仓库：\n\n", len(repos)))
	for i, r := range repos {
		sb.WriteString(fmt.Sprintf("%d. %s", i+1, r.FullName))
		if r.Description != "" {
			sb.WriteString(fmt.Sprintf(" - %s", r.Description))
		}
		sb.WriteString(fmt.Sprintf(" (Star: %d, Fork: %d, 最后同步: %s)\n",
			r.StarsCount, r.ForksCount, r.SyncedAt.Format("2006-01-02 15:04")))
	}

	return sb.String(), nil
}
