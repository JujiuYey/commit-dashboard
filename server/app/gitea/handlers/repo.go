package handlers

import (
	"github.com/gofiber/fiber/v2"

	gitea_res "sag-reg-server/app/gitea/models/response"
	"sag-reg-server/app/gitea/repository"
	"sag-reg-server/common/response"
)

// RepoHandler 仓库处理器
type RepoHandler struct {
	repoRepo *repository.RepoRepository
}

// NewRepoHandler 创建仓库处理器
func NewRepoHandler(repoRepo *repository.RepoRepository) *RepoHandler {
	return &RepoHandler{repoRepo: repoRepo}
}

// List 获取仓库列表
func (h *RepoHandler) List(c *fiber.Ctx) error {
	repos, err := h.repoRepo.List(c.Context())
	if err != nil {
		return response.InternalServerCtx(c, "查询仓库列表失败")
	}

	items := make([]gitea_res.RepoItem, len(repos))
	for i, r := range repos {
		items[i] = gitea_res.RepoItem{
			ID:              r.ID,
			GiteaID:         r.GiteaID,
			Owner:           r.Owner,
			Name:            r.Name,
			FullName:        r.FullName,
			Description:     r.Description,
			DefaultBranch:   r.DefaultBranch,
			StarsCount:      r.StarsCount,
			ForksCount:      r.ForksCount,
			OpenIssuesCount: r.OpenIssuesCount,
			SyncedAt:        r.SyncedAt.Format("2006-01-02 15:04:05"),
		}
	}

	return response.SuccessCtx(c, items)
}
