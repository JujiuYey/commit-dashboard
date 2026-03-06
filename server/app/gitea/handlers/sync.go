package handlers

import (
	"github.com/gofiber/fiber/v2"

	gitea_req "sag-reg-server/app/gitea/models/request"
	"sag-reg-server/app/gitea/services"
	"sag-reg-server/common/response"
	gitea_client "sag-reg-server/infrastructure/gitea"
)

// SyncHandler 同步处理器
type SyncHandler struct {
	syncService *services.SyncService
}

// NewSyncHandler 创建同步处理器
func NewSyncHandler(syncService *services.SyncService) *SyncHandler {
	return &SyncHandler{syncService: syncService}
}

// SyncRepos 同步仓库列表
func (h *SyncHandler) SyncRepos(c *fiber.Ctx) error {
	giteaURL := c.Get("X-Gitea-Base-Url")
	giteaToken := c.Get("X-Gitea-Token")

	if giteaURL == "" || giteaToken == "" {
		return response.BadRequestCtx(c, "请提供 Gitea 连接信息 (X-Gitea-Base-Url, X-Gitea-Token)")
	}

	client := gitea_client.NewClient(giteaURL, giteaToken)

	if _, err := client.VerifyToken(); err != nil {
		return response.UnauthorizedCtx(c, "Gitea Token 无效")
	}

	result, err := h.syncService.SyncReposOnly(c.Context(), client)
	if err != nil {
		return response.InternalServerCtx(c, "同步仓库失败: "+err.Error())
	}

	return response.SuccessCtx(c, result)
}

// SyncCommits 同步提交记录
func (h *SyncHandler) SyncCommits(c *fiber.Ctx) error {
	// 从 Header 获取 Gitea 连接信息
	giteaURL := c.Get("X-Gitea-Base-Url")
	giteaToken := c.Get("X-Gitea-Token")

	if giteaURL == "" || giteaToken == "" {
		return response.BadRequestCtx(c, "请提供 Gitea 连接信息 (X-Gitea-Base-Url, X-Gitea-Token)")
	}

	// 解析请求体
	var req gitea_req.SyncRequest
	if err := c.BodyParser(&req); err != nil {
		// body 可以为空，使用默认值
		req = gitea_req.SyncRequest{}
	}

	// 创建 Gitea 客户端
	client := gitea_client.NewClient(giteaURL, giteaToken)

	// 验证 Token
	if _, err := client.VerifyToken(); err != nil {
		return response.UnauthorizedCtx(c, "Gitea Token 无效")
	}

	// 执行同步
	result, err := h.syncService.SyncCommits(c.Context(), client, req.RepoIDs)
	if err != nil {
		return response.InternalServerCtx(c, "同步失败: "+err.Error())
	}

	return response.SuccessCtx(c, result)
}

// SyncRepoCommits 同步单个仓库的提交记录
func (h *SyncHandler) SyncRepoCommits(c *fiber.Ctx) error {
	giteaURL := c.Get("X-Gitea-Base-Url")
	giteaToken := c.Get("X-Gitea-Token")

	if giteaURL == "" || giteaToken == "" {
		return response.BadRequestCtx(c, "请提供 Gitea 连接信息 (X-Gitea-Base-Url, X-Gitea-Token)")
	}

	var req gitea_req.SyncRepoCommitsRequest
	if err := c.BodyParser(&req); err != nil || req.RepoID == 0 {
		return response.BadRequestCtx(c, "请提供有效的 repo_id")
	}

	client := gitea_client.NewClient(giteaURL, giteaToken)

	if _, err := client.VerifyToken(); err != nil {
		return response.UnauthorizedCtx(c, "Gitea Token 无效")
	}

	newCommits, err := h.syncService.SyncRepoCommitsByID(c.Context(), client, req.RepoID)
	if err != nil {
		return response.InternalServerCtx(c, "同步失败: "+err.Error())
	}

	return response.SuccessCtx(c, fiber.Map{"new_commits": newCommits})
}
