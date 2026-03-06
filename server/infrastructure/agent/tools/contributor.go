package tools

import (
	"context"
	"fmt"
	"strings"

	"sag-reg-server/app/gitea/repository"
)

// ContributorTools 贡献者工具集
type ContributorTools struct {
	contributorRepo *repository.ContributorRepository
}

// NewContributorTools 创建贡献者工具集
func NewContributorTools(contributorRepo *repository.ContributorRepository) *ContributorTools {
	return &ContributorTools{contributorRepo: contributorRepo}
}

// ListContributors 查询贡献者列表
func (t *ContributorTools) ListContributors(ctx context.Context, params map[string]interface{}) (string, error) {
	limit := 20
	if v, ok := params["limit"].(float64); ok && int(v) > 0 {
		limit = int(v)
	}

	contributors, total, err := t.contributorRepo.List(ctx, limit, 0)
	if err != nil {
		return "", fmt.Errorf("查询贡献者列表失败: %w", err)
	}

	if len(contributors) == 0 {
		return "没有找到贡献者数据。", nil
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("共 %d 位贡献者：\n\n", total))
	for i, c := range contributors {
		sb.WriteString(fmt.Sprintf("%d. %s (%s) - %d 次提交, +%d/-%d 行\n",
			i+1, c.Name, c.Email, c.TotalCommits, c.TotalAdditions, c.TotalDeletions))
	}

	return sb.String(), nil
}

// GetContributorDetail 获取贡献者详情
func (t *ContributorTools) GetContributorDetail(ctx context.Context, params map[string]interface{}) (string, error) {
	id := 0
	if v, ok := params["id"].(float64); ok {
		id = int(v)
	}
	if id == 0 {
		return "", fmt.Errorf("缺少贡献者 ID 参数")
	}

	contributor, err := t.contributorRepo.GetByID(ctx, id)
	if err != nil {
		return "", fmt.Errorf("贡献者不存在")
	}

	repoStats, err := t.contributorRepo.GetRepoStatsByContributorID(ctx, id)
	if err != nil {
		return "", fmt.Errorf("查询仓库统计失败: %w", err)
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("贡献者: %s (%s)\n", contributor.Name, contributor.Email))
	sb.WriteString(fmt.Sprintf("总提交: %d 次, 新增: %d 行, 删除: %d 行\n", contributor.TotalCommits, contributor.TotalAdditions, contributor.TotalDeletions))
	sb.WriteString(fmt.Sprintf("活跃时间: %s ~ %s\n", contributor.FirstCommitAt.Format("2006-01-02"), contributor.LastCommitAt.Format("2006-01-02")))

	if len(repoStats) > 0 {
		sb.WriteString("\n各仓库统计：\n")
		for _, rs := range repoStats {
			repoName := ""
			if rs.Repository != nil {
				repoName = rs.Repository.FullName
			}
			sb.WriteString(fmt.Sprintf("  - %s: %d 次提交, +%d/-%d 行\n",
				repoName, rs.CommitsCount, rs.Additions, rs.Deletions))
		}
	}

	return sb.String(), nil
}
