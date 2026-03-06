package handlers

import (
	"github.com/gofiber/fiber/v2"

	gitea_req "sag-reg-server/app/gitea/models/request"
	gitea_res "sag-reg-server/app/gitea/models/response"
	"sag-reg-server/app/gitea/repository"
	"sag-reg-server/common/pagination"
	"sag-reg-server/common/response"
)

// ContributorHandler 贡献者处理器
type ContributorHandler struct {
	contributorRepo *repository.ContributorRepository
}

// NewContributorHandler 创建贡献者处理器
func NewContributorHandler(contributorRepo *repository.ContributorRepository) *ContributorHandler {
	return &ContributorHandler{contributorRepo: contributorRepo}
}

// List 获取贡献者列表
func (h *ContributorHandler) List(c *fiber.Ctx) error {
	var params gitea_req.ContributorQueryParams
	if err := c.QueryParser(&params); err != nil {
		return response.BadRequestCtx(c, "参数解析失败")
	}

	paging := pagination.PaginationRequest{
		Page:     params.Page,
		PageSize: params.PageSize,
	}
	paging.Validate()

	contributors, total, err := h.contributorRepo.List(
		c.Context(),
		paging.PageSize,
		paging.GetOffset(),
	)
	if err != nil {
		return response.InternalServerCtx(c, "查询贡献者列表失败")
	}

	items := make([]gitea_res.ContributorItem, len(contributors))
	for i, ct := range contributors {
		items[i] = gitea_res.ContributorItem{
			ID:             ct.ID,
			Name:           ct.Name,
			Email:          ct.Email,
			TotalCommits:   ct.TotalCommits,
			TotalAdditions: ct.TotalAdditions,
			TotalDeletions: ct.TotalDeletions,
			FirstCommitAt:  ct.FirstCommitAt.Format("2006-01-02 15:04:05"),
			LastCommitAt:   ct.LastCommitAt.Format("2006-01-02 15:04:05"),
		}
	}

	return response.PaginateCtx(c, items, total, paging.Page, paging.PageSize)
}

// Detail 获取贡献者详情
func (h *ContributorHandler) Detail(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return response.BadRequestCtx(c, "无效的贡献者 ID")
	}

	// 获取贡献者基本信息
	contributor, err := h.contributorRepo.GetByID(c.Context(), id)
	if err != nil {
		return response.NotFoundCtx(c, "贡献者不存在")
	}

	// 获取各仓库的统计数据
	repoStats, err := h.contributorRepo.GetRepoStatsByContributorID(c.Context(), id)
	if err != nil {
		return response.InternalServerCtx(c, "查询贡献者仓库统计失败")
	}

	repoStatsItems := make([]gitea_res.ContributorRepoStatsItem, len(repoStats))
	for i, rs := range repoStats {
		repoName := ""
		if rs.Repository != nil {
			repoName = rs.Repository.FullName
		}
		repoStatsItems[i] = gitea_res.ContributorRepoStatsItem{
			RepoID:        rs.RepoID,
			RepoName:      repoName,
			CommitsCount:  rs.CommitsCount,
			Additions:     rs.Additions,
			Deletions:     rs.Deletions,
			FirstCommitAt: rs.FirstCommitAt.Format("2006-01-02 15:04:05"),
			LastCommitAt:  rs.LastCommitAt.Format("2006-01-02 15:04:05"),
		}
	}

	return response.SuccessCtx(c, gitea_res.ContributorDetailResponse{
		ContributorItem: gitea_res.ContributorItem{
			ID:             contributor.ID,
			Name:           contributor.Name,
			Email:          contributor.Email,
			TotalCommits:   contributor.TotalCommits,
			TotalAdditions: contributor.TotalAdditions,
			TotalDeletions: contributor.TotalDeletions,
			FirstCommitAt:  contributor.FirstCommitAt.Format("2006-01-02 15:04:05"),
			LastCommitAt:   contributor.LastCommitAt.Format("2006-01-02 15:04:05"),
		},
		RepoStats: repoStatsItems,
	})
}
