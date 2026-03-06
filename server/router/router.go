package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	ai_router "sag-reg-server/app/ai/router"
	gitea_router "sag-reg-server/app/gitea/router"
	"sag-reg-server/infrastructure/agent"
	"sag-reg-server/infrastructure/database"
)

// 配置路由
func SetupRouter(
	dbService *database.DatabaseService,
	agentInstance *agent.Agent,
) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "Commit Dashboard Server",
		ErrorHandler: customErrorHandler,
	})

	// 全局中间件
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Gitea-Token,X-Gitea-Base-Url,X-User-Id",
		AllowCredentials: true,
	}))

	// 路由组
	api := app.Group("/api")

	// Gitea 相关路由
	db := dbService.GetDB()
	gitea_router.SetupGiteaRoutes(api, db)

	// AI 相关路由
	if agentInstance != nil {
		ai_router.SetupAgentRoutes(api, db, agentInstance)
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
