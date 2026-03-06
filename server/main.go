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
	"sag-reg-server/router"
)

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

	// 初始化 Agent
	agentInstance := agent.SetupAgent(dbService.GetDB())

	// 设置路由
	app := router.SetupRouter(dbService, agentInstance)

	// 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Println("🚀 Commit Dashboard 后端服务启动在 http://localhost:8080")
		if err := app.Listen(":8080"); err != nil {
			log.Fatal("启动服务器失败:", err)
		}
	}()

	<-quit
	log.Println("⏹️  服务器正在关闭...")
}
