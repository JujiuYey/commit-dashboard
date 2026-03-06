package router

import (
	"github.com/gofiber/fiber/v2"

	system_handlers "sag-reg-server/app/system/handlers"
	"sag-reg-server/infrastructure/queue"
)

// 配置队列监控路由
func SetupQueueRoutes(router fiber.Router, taskQueue *queue.TaskQueue) {
	queueHandler := system_handlers.NewQueueHandler(taskQueue)

	queue := router.Group("/queue")
	{
		// 获取队列统计
		queue.Get("/stats", queueHandler.GetStats)
		// 获取任务列表
		queue.Get("/tasks", queueHandler.GetTasks)
	}
}
