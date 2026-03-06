package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"

	"sag-reg-server/config"
	"sag-reg-server/infrastructure/agent"
	"sag-reg-server/infrastructure/database"
	"sag-reg-server/infrastructure/queue"
	"sag-reg-server/infrastructure/storage"
	"sag-reg-server/router"
	ai_services "sag-reg-server/app/ai/services"
)

//go:generate msgp -file=../../models/api/ai/chat.go -o=../../models/api/ai/chat_msgp.go -tests=false
//go:generate msgp -file=../../models/api/ai/rag.go -o=../../models/api/ai/rag_msgp.go -tests=false

func main() {
	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Printf("⚠️  未找到 .env 文件: %v", err)
	}

	// 初始化数据库
	dbConfig := config.GetDatabaseConfig()
	dbService, err := database.NewDatabaseService(dbConfig.GetDSN())
	if err != nil {
		log.Fatalf("❌ 数据库初始化失败: %v", err)
	}
	defer dbService.Close()
	log.Println("✅ 数据库连接成功")

	// 初始化 MinIO
	minioConfig := config.GetMinIOConfig()
	minioService, err := storage.NewMinIOService(minioConfig)
	if err != nil {
		log.Fatalf("❌ MinIO 初始化失败: %v", err)
	}

	// 初始化 Redis 和任务队列
	redisConfig := config.GetRedisConfig()
	taskQueue := queue.NewTaskQueue(redisConfig.Addr, redisConfig.Password, redisConfig.DB)
	defer taskQueue.Close()
	log.Println("✅ 任务队列初始化成功")

	// 初始化 RAG 引擎和文档处理器
	ragEngine := ai_services.NewRAGEngine()
	docProcessor := ai_services.NewDocumentProcessor()

	// 初始化 Agent 系统
	agentInstance := agent.SetupAgent(dbService.GetDB())

	// 设置路由（传递 Agent 实例）
	app := router.SetupRouter(dbService, ragEngine, docProcessor, minioService, taskQueue, agentInstance)
	taskWorker := queue.NewTaskWorker(redisConfig.Addr, redisConfig.Password, redisConfig.DB, dbService, docProcessor, minioService)
	go func() {
		if err := taskWorker.Start(); err != nil {
			log.Fatalf("❌ 任务处理器启动失败: %v", err)
		}
	}()
	defer taskWorker.Shutdown()

	// 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		// 启动 Fiber 服务器
		log.Println("🚀 Go RAG 后端服务启动在 http://localhost:8080")
		if err := app.Listen(":8080"); err != nil {
			log.Fatal("启动服务器失败:", err)
		}
	}()

	<-quit
	log.Println("⏹️  服务器正在关闭...")
}
