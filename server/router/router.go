package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"sag-reg-server/infrastructure/agent"
	"sag-reg-server/infrastructure/database"
	"sag-reg-server/infrastructure/queue"
	"sag-reg-server/infrastructure/storage"
	"sag-reg-server/middleware"
	ai_router "sag-reg-server/app/ai/router"
	file_router "sag-reg-server/app/file/router"
	system_router "sag-reg-server/app/system/router"
	wiki_router "sag-reg-server/app/wiki/router"
	ai_services "sag-reg-server/app/ai/services"
)

// 配置路由
func SetupRouter(
	dbService *database.DatabaseService,
	ragEngine *ai_services.RAGEngine,
	docProcessor *ai_services.DocumentProcessor,
	minioService *storage.MinIOService,
	taskQueue *queue.TaskQueue,
	agentInstance *agent.Agent,
) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "SAG RAG Server",
		ErrorHandler: customErrorHandler,
	})

	// 全局中间件
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	// 路由组
	api := app.Group("/api")

	// 文件访问路由（公开访问，通过后端代理 MinIO）
	file_router.SetupFileRoutes(api.Group("/"), minioService)

	// 认证路由（包含公开和受保护的路由）
	system_router.SetupAuthRoutes(api.Group("/"), dbService)

	// 需要认证的路由组
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		// 文档管理路由
		wiki_router.SetupDocumentRoutes(protected.Group("/"), dbService, docProcessor, minioService, taskQueue)

		// 队列监控路由
		system_router.SetupQueueRoutes(protected.Group("/"), taskQueue)

		// 部门管理路由
		system_router.SetupDepartmentRoutes(protected.Group("/"), dbService)

		// 角色管理路由
		system_router.SetupRoleRoutes(protected.Group("/"), dbService)

		// 用户管理路由
		system_router.SetupUserRoutes(protected.Group("/"), dbService, minioService)

		// 文件夹管理路由
		wiki_router.SetupFolderRoutes(protected.Group("/"), dbService)

		// 路由
		ai_router.SetupAgentRoutes(protected.Group("/"), dbService, agentInstance)

		// 对话路由
		ai_router.SetupRagRoutes(protected.Group("/"), dbService, ragEngine)
	}

	// 管理员路由（需要 admin 角色）
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"))
	{
		// 这里可以添加管理员专用的路由
		// 例如：用户管理、系统配置等
	}

	return app
}

// customErrorHandler 自定义错误处理
func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return c.Status(code).JSON(fiber.Map{
		"error": message,
	})
}
