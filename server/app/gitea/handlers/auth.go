package handlers

import (
	"github.com/gofiber/fiber/v2"

	"sag-reg-server/common/response"
	gitea_client "sag-reg-server/infrastructure/gitea"
)

// AuthHandler 认证处理器
type AuthHandler struct{}

// NewAuthHandler 创建认证处理器
func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

// Verify 验证 Gitea Token，返回用户信息
func (h *AuthHandler) Verify(c *fiber.Ctx) error {
	giteaURL := c.Get("X-Gitea-Base-Url")
	giteaToken := c.Get("X-Gitea-Token")

	if giteaURL == "" || giteaToken == "" {
		return response.BadRequestCtx(c, "请提供 Gitea 连接信息 (X-Gitea-Base-Url, X-Gitea-Token)")
	}

	client := gitea_client.NewClient(giteaURL, giteaToken)
	user, err := client.VerifyToken()
	if err != nil {
		return response.UnauthorizedCtx(c, "Gitea Token 无效")
	}

	return response.SuccessCtx(c, user)
}
