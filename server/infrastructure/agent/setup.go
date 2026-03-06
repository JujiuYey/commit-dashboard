package agent

import (
	"log"

	"github.com/uptrace/bun"

	"sag-reg-server/app/gitea/repository"
	"sag-reg-server/infrastructure/agent/tools"
	"sag-reg-server/infrastructure/llm"
)

// SetupAgent 初始化并配置 Agent 系统（使用 Eino 框架）
func SetupAgent(db *bun.DB) *Agent {
	log.Println("🔧 初始化 Agent 系统（使用 Eino 框架）...")

	// 初始化 LLM 客户端
	llmClient := llm.NewEinoClient()

	// 初始化工具注册中心
	toolRegistry := NewToolRegistry()

	// 注册提交记录工具
	registerCommitTools(toolRegistry, db)

	// 注册贡献者工具
	registerContributorTools(toolRegistry, db)

	// 注册仓库工具
	registerRepoTools(toolRegistry, db)

	log.Printf("✅ 已注册 %d 个 Agent 工具", len(toolRegistry.List()))

	// 尝试创建基于 Eino 的 Agent
	einoAgent, err := NewEinoAgent(llmClient, toolRegistry)
	if err != nil {
		log.Printf("⚠️  创建 Eino Agent 失败，回退到旧实现: %v", err)
		return NewAgent(llmClient, toolRegistry)
	}

	log.Println("✅ 使用 Eino Agent 框架")

	return &Agent{
		llmClient:    llmClient,
		toolRegistry: toolRegistry,
		einoAgent:    einoAgent,
	}
}

// registerCommitTools 注册提交记录相关工具
func registerCommitTools(toolRegistry *ToolRegistry, db *bun.DB) {
	commitTools := tools.NewCommitTools(repository.NewCommitRepository(db))

	toolRegistry.Register(Tool{
		Name:        "list_commits",
		Description: "查询提交记录列表，可按仓库、作者、时间范围筛选",
		Parameters: []ToolParameter{
			{Name: "repo_id", Type: "integer", Description: "仓库 ID（可选，不传则查全部）", Required: false},
			{Name: "author", Type: "string", Description: "作者邮箱（可选）", Required: false},
			{Name: "start_date", Type: "string", Description: "开始日期，格式 YYYY-MM-DD（可选）", Required: false},
			{Name: "end_date", Type: "string", Description: "结束日期，格式 YYYY-MM-DD（可选）", Required: false},
			{Name: "limit", Type: "integer", Description: "返回数量，默认 10", Required: false},
		},
		Handler: commitTools.ListCommits,
	})

	toolRegistry.Register(Tool{
		Name:        "get_commit_stats",
		Description: "获取提交统计数据，包括总提交数、总新增行数、总删除行数",
		Parameters: []ToolParameter{
			{Name: "repo_id", Type: "integer", Description: "仓库 ID（可选，不传则统计全部）", Required: false},
		},
		Handler: commitTools.GetCommitStats,
	})

	toolRegistry.Register(Tool{
		Name:        "get_commit_trend",
		Description: "获取提交趋势数据，按日期统计每天的提交次数",
		Parameters: []ToolParameter{
			{Name: "repo_id", Type: "integer", Description: "仓库 ID（可选）", Required: false},
			{Name: "start_date", Type: "string", Description: "开始日期，格式 YYYY-MM-DD（可选）", Required: false},
			{Name: "end_date", Type: "string", Description: "结束日期，格式 YYYY-MM-DD（可选）", Required: false},
		},
		Handler: commitTools.GetCommitTrend,
	})
}

// registerContributorTools 注册贡献者相关工具
func registerContributorTools(toolRegistry *ToolRegistry, db *bun.DB) {
	contributorTools := tools.NewContributorTools(repository.NewContributorRepository(db))

	toolRegistry.Register(Tool{
		Name:        "list_contributors",
		Description: "查询贡献者排行榜，按提交次数降序排列",
		Parameters: []ToolParameter{
			{Name: "limit", Type: "integer", Description: "返回数量，默认 20", Required: false},
		},
		Handler: contributorTools.ListContributors,
	})

	toolRegistry.Register(Tool{
		Name:        "get_contributor_detail",
		Description: "获取贡献者详情，包括在各仓库的提交统计",
		Parameters: []ToolParameter{
			{Name: "id", Type: "integer", Description: "贡献者 ID", Required: true},
		},
		Handler: contributorTools.GetContributorDetail,
	})
}

// registerRepoTools 注册仓库相关工具
func registerRepoTools(toolRegistry *ToolRegistry, db *bun.DB) {
	repoTools := tools.NewRepoTools(repository.NewRepoRepository(db))

	toolRegistry.Register(Tool{
		Name:        "list_repos",
		Description: "查询已同步的仓库列表，包括 Star、Fork 等信息",
		Parameters:  []ToolParameter{},
		Handler:     repoTools.ListRepos,
	})
}
