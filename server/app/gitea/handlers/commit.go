package handlers

import (
	"github.com/gofiber/fiber/v2"

	gitea_req "sag-reg-server/app/gitea/models/request"
	gitea_res "sag-reg-server/app/gitea/models/response"
	"sag-reg-server/app/gitea/repository"
	"sag-reg-server/common/pagination"
	"sag-reg-server/common/response"
)

// CommitHandler 提交记录处理器
type CommitHandler struct {
	commitRepo *repository.CommitRepository
}

// NewCommitHandler 创建提交记录处理器
func NewCommitHandler(commitRepo *repository.CommitRepository) *CommitHandler {
	return &CommitHandler{commitRepo: commitRepo}
}

// List 获取提交记录列表
func (h *CommitHandler) List(c *fiber.Ctx) error {
	var params gitea_req.CommitQueryParams
	if err := c.QueryParser(&params); err != nil {
		return response.BadRequestCtx(c, "参数解析失败")
	}

	// 分页参数
	paging := pagination.PaginationRequest{
		Page:     params.Page,
		PageSize: params.PageSize,
	}
	paging.Validate()

	commits, total, err := h.commitRepo.List(
		c.Context(),
		params.RepoID,
		params.Author,
		params.StartDate,
		params.EndDate,
		paging.PageSize,
		paging.GetOffset(),
	)
	if err != nil {
		return response.InternalServerCtx(c, "查询提交记录失败")
	}

	// 转换为响应结构
	items := make([]gitea_res.CommitItem, len(commits))
	for i, cm := range commits {
		repoName := ""
		if cm.Repository != nil {
			repoName = cm.Repository.FullName
		}
		items[i] = gitea_res.CommitItem{
			ID:           cm.ID,
			SHA:          cm.SHA,
			AuthorName:   cm.AuthorName,
			AuthorEmail:  cm.AuthorEmail,
			Message:      cm.Message,
			Additions:    cm.Additions,
			Deletions:    cm.Deletions,
			TotalChanges: cm.TotalChanges,
			RepoName:     repoName,
			CommittedAt:  cm.CommittedAt.Format("2006-01-02 15:04:05"),
		}
	}

	return response.PaginateCtx(c, items, total, paging.Page, paging.PageSize)
}

// Stats 获取提交统计数据
func (h *CommitHandler) Stats(c *fiber.Ctx) error {
	repoID := c.QueryInt("repo_id", 0)
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	// 获取总统计
	totalCommits, totalAdditions, totalDeletions, err := h.commitRepo.GetStats(c.Context(), repoID)
	if err != nil {
		return response.InternalServerCtx(c, "查询提交统计失败")
	}

	// 获取趋势数据
	trendData, err := h.commitRepo.GetTrend(c.Context(), repoID, startDate, endDate)
	if err != nil {
		return response.InternalServerCtx(c, "查询提交趋势失败")
	}

	trend := make([]gitea_res.CommitTrendItem, len(trendData))
	for i, t := range trendData {
		trend[i] = gitea_res.CommitTrendItem{
			Date:    t.Date,
			Commits: t.Commits,
		}
	}

	// 获取热力图数据
	heatmapData, err := h.commitRepo.GetHeatmap(c.Context(), repoID)
	if err != nil {
		return response.InternalServerCtx(c, "查询热力图数据失败")
	}

	heatmap := make([]gitea_res.CommitHeatmapItem, len(heatmapData))
	for i, h := range heatmapData {
		heatmap[i] = gitea_res.CommitHeatmapItem{
			DayOfWeek: h.DayOfWeek,
			Hour:      h.Hour,
			Count:     h.Count,
		}
	}

	return response.SuccessCtx(c, gitea_res.CommitStatsResponse{
		TotalCommits:   totalCommits,
		TotalAdditions: totalAdditions,
		TotalDeletions: totalDeletions,
		Trend:          trend,
		Heatmap:        heatmap,
	})
}
