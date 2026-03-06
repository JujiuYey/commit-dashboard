package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/uptrace/bun"

	"sag-reg-server/app/gitea/handlers"
	"sag-reg-server/app/gitea/repository"
	"sag-reg-server/app/gitea/services"
)

// SetupGiteaRoutes 注册 Gitea 相关路由
func SetupGiteaRoutes(router fiber.Router, db *bun.DB) {
	// 初始化 repositories
	repoRepo := repository.NewRepoRepository(db)
	commitRepo := repository.NewCommitRepository(db)
	contributorRepo := repository.NewContributorRepository(db)

	// 初始化 services
	syncService := services.NewSyncService(db)

	// 初始化 handlers
	authHandler := handlers.NewAuthHandler()
	syncHandler := handlers.NewSyncHandler(syncService)
	repoHandler := handlers.NewRepoHandler(repoRepo)
	commitHandler := handlers.NewCommitHandler(commitRepo)
	contributorHandler := handlers.NewContributorHandler(contributorRepo)

	// 认证路由
	router.Post("/verify", authHandler.Verify)

	// 同步路由
	sync := router.Group("/sync")
	{
		sync.Post("/repos", syncHandler.SyncRepos)
		sync.Post("/commits", syncHandler.SyncCommits)
		sync.Post("/repo-commits", syncHandler.SyncRepoCommits)
	}

	// 仓库路由
	repos := router.Group("/repos")
	{
		repos.Get("/", repoHandler.List)
	}

	// 提交记录路由
	commits := router.Group("/commits")
	{
		commits.Get("/", commitHandler.List)
		commits.Get("/stats", commitHandler.Stats)
	}

	// 贡献者路由
	contributors := router.Group("/contributors")
	{
		contributors.Get("/", contributorHandler.List)
		contributors.Get("/:id", contributorHandler.Detail)
	}
}
