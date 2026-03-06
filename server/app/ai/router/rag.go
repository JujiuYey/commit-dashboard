package router

import (
	"github.com/gofiber/fiber/v2"

	ai_handlers "sag-reg-server/app/ai/handlers"
	ai_services "sag-reg-server/app/ai/services"
	"sag-reg-server/infrastructure/database"
)

// 配置 RAG 相关路由
func SetupRagRoutes(
	router fiber.Router,
	dbService *database.DatabaseService,
	ragEngine *ai_services.RAGEngine,
) {
	ragHandler := ai_handlers.NewRagHandler(dbService, ragEngine)

	rag := router.Group("/ai/rag")
	{
		// 聊天接口
		rag.Post("/chat", ragHandler.Chat)

		// 会话管理
		rag.Get("/sessions", ragHandler.ListSessions)                         // 获取会话列表
		rag.Get("/sessions/:session_id/history", ragHandler.History)          // 获取会话历史
		rag.Delete("/sessions/:session_id", ragHandler.DeleteSession)         // 删除会话
		rag.Put("/sessions/:session_id/title", ragHandler.UpdateSessionTitle) // 更新会话标题
	}
}
