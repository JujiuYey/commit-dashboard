package tools

import (
	"context"
	"fmt"
	"strings"

	"sag-reg-server/app/gitea/repository"
)

// CommitTools 提交记录工具集
type CommitTools struct {
	commitRepo *repository.CommitRepository
}

// NewCommitTools 创建提交记录工具集
func NewCommitTools(commitRepo *repository.CommitRepository) *CommitTools {
	return &CommitTools{commitRepo: commitRepo}
}

// ListCommits 查询提交记录
func (t *CommitTools) ListCommits(ctx context.Context, params map[string]interface{}) (string, error) {
	repoID := 0
	if v, ok := params["repo_id"].(float64); ok {
		repoID = int(v)
	}
	author, _ := params["author"].(string)
	startDate, _ := params["start_date"].(string)
	endDate, _ := params["end_date"].(string)

	limit := 10
	if v, ok := params["limit"].(float64); ok && int(v) > 0 {
		limit = int(v)
	}

	commits, total, err := t.commitRepo.List(ctx, repoID, author, startDate, endDate, limit, 0)
	if err != nil {
		return "", fmt.Errorf("查询提交记录失败: %w", err)
	}

	if len(commits) == 0 {
		return "没有找到提交记录。", nil
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("共 %d 条提交记录，显示前 %d 条：\n\n", total, len(commits)))
	for i, c := range commits {
		repoName := ""
		if c.Repository != nil {
			repoName = c.Repository.FullName
		}
		// 截断过长的提交信息
		msg := c.Message
		if idx := strings.Index(msg, "\n"); idx > 0 {
			msg = msg[:idx]
		}
		if len(msg) > 80 {
			msg = msg[:80] + "..."
		}
		sb.WriteString(fmt.Sprintf("%d. [%s] %s - %s (%s, +%d/-%d)\n",
			i+1, c.CommittedAt.Format("2006-01-02 15:04"), repoName, msg, c.AuthorName, c.Additions, c.Deletions))
	}

	return sb.String(), nil
}

// GetCommitStats 获取提交统计
func (t *CommitTools) GetCommitStats(ctx context.Context, params map[string]interface{}) (string, error) {
	repoID := 0
	if v, ok := params["repo_id"].(float64); ok {
		repoID = int(v)
	}

	totalCommits, totalAdditions, totalDeletions, err := t.commitRepo.GetStats(ctx, repoID)
	if err != nil {
		return "", fmt.Errorf("查询统计失败: %w", err)
	}

	return fmt.Sprintf("提交统计：\n- 总提交数: %d\n- 总新增行数: %d\n- 总删除行数: %d\n- 净变更行数: %d",
		totalCommits, totalAdditions, totalDeletions, totalAdditions-totalDeletions), nil
}

// GetCommitTrend 获取提交趋势
func (t *CommitTools) GetCommitTrend(ctx context.Context, params map[string]interface{}) (string, error) {
	repoID := 0
	if v, ok := params["repo_id"].(float64); ok {
		repoID = int(v)
	}
	startDate, _ := params["start_date"].(string)
	endDate, _ := params["end_date"].(string)

	trend, err := t.commitRepo.GetTrend(ctx, repoID, startDate, endDate)
	if err != nil {
		return "", fmt.Errorf("查询趋势失败: %w", err)
	}

	if len(trend) == 0 {
		return "没有找到趋势数据。", nil
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("提交趋势（%d 天有提交）：\n\n", len(trend)))
	for _, t := range trend {
		sb.WriteString(fmt.Sprintf("  %s: %d 次提交\n", t.Date, t.Commits))
	}

	return sb.String(), nil
}
