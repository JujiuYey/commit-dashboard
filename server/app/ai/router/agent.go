package router

import (
	"github.com/gofiber/fiber/v2"

	ai_handlers "sag-reg-server/app/ai/handlers"
	"sag-reg-server/infrastructure/agent"
	"sag-reg-server/infrastructure/database"
)

// 配置 Agent 相关路由
func SetupAgentRoutes(
	router fiber.Router,
	dbService *database.DatabaseService,
	agentInstance *agent.Agent,
) {
	agentHandler := ai_handlers.NewAgentHandler(dbService, agentInstance)

	agent := router.Group("/ai/agent")
	{
		// 聊天接口
		agent.Post("/chat", agentHandler.Chat)

		// 会话管理
		agent.Get("/sessions", agentHandler.ListSessions)                         // 获取会话列表
		agent.Get("/sessions/:session_id/history", agentHandler.History)          // 获取会话历史
		agent.Delete("/sessions/:session_id", agentHandler.DeleteSession)         // 删除会话
		agent.Put("/sessions/:session_id/title", agentHandler.UpdateSessionTitle) // 更新会话标题
	}
}
