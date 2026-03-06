package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/uptrace/bun"

	ai_handlers "sag-reg-server/app/ai/handlers"
	"sag-reg-server/app/ai/repository"
	"sag-reg-server/infrastructure/agent"
)

// 配置 Agent 相关路由
func SetupAgentRoutes(router fiber.Router, db *bun.DB, agentInstance *agent.Agent) {
	sessions := repository.NewAgentSessionRepository(db)
	messages := repository.NewAgentMessageRepository(db)
	agentHandler := ai_handlers.NewAgentHandler(sessions, messages, agentInstance)

	agentGroup := router.Group("/ai/agent")
	{
		agentGroup.Post("/chat", agentHandler.Chat)
		agentGroup.Get("/sessions", agentHandler.ListSessions)
		agentGroup.Get("/sessions/:session_id/history", agentHandler.History)
		agentGroup.Delete("/sessions/:session_id", agentHandler.DeleteSession)
		agentGroup.Put("/sessions/:session_id/title", agentHandler.UpdateSessionTitle)
	}
}
