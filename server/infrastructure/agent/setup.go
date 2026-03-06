package agent

import (
	"log"

	"github.com/uptrace/bun"

	"sag-reg-server/infrastructure/agent/tools"
	"sag-reg-server/infrastructure/llm"
	system_repo "sag-reg-server/app/system/repository"
)

// 初始化并配置 Agent 系统（使用 Eino 框架）
func SetupAgent(db *bun.DB) *Agent {
	log.Println("🔧 初始化 Agent 系统（使用 Eino 框架）...")

	// 初始化 LLM 客户端
	llmClient := llm.NewEinoClient()

	// 初始化工具注册中心
	toolRegistry := NewToolRegistry()

	// 注册部门操作工具
	registerDepartmentTools(toolRegistry, db)

	// 注册角色操作工具
	registerRoleTools(toolRegistry, db)

	log.Printf("✅ 已注册 %d 个 Agent 工具", len(toolRegistry.List()))

	// 尝试创建基于 Eino 的 Agent
	einoAgent, err := NewEinoAgent(llmClient, toolRegistry)
	if err != nil {
		log.Printf("⚠️  创建 Eino Agent 失败，回退到旧实现: %v", err)
		// 回退到旧的实现
		return NewAgent(llmClient, toolRegistry)
	}

	log.Println("✅ 使用 Eino Agent 框架")

	// 包装为兼容的 Agent 接口
	return &Agent{
		llmClient:    llmClient,
		toolRegistry: toolRegistry,
		einoAgent:    einoAgent,
	}
}

// registerDepartmentTools 注册部门相关工具
func registerDepartmentTools(toolRegistry *ToolRegistry, db *bun.DB) {
	deptTools := tools.NewDepartmentTools(system_repo.NewDepartmentRepository(db))

	toolRegistry.Register(Tool{
		Name:        "create_department",
		Description: "创建新部门，需要提供部门名称，可选描述",
		Parameters: []ToolParameter{
			{Name: "name", Type: "string", Description: "部门名称", Required: true},
			{Name: "description", Type: "string", Description: "部门描述", Required: false},
		},
		Handler: deptTools.CreateDepartment,
	})

	toolRegistry.Register(Tool{
		Name:        "update_department",
		Description: "更新部门信息，需要提供部门ID和要更新的内容",
		Parameters: []ToolParameter{
			{Name: "id", Type: "string", Description: "部门ID", Required: true},
			{Name: "name", Type: "string", Description: "新的部门名称", Required: false},
			{Name: "description", Type: "string", Description: "新的部门描述", Required: false},
		},
		Handler: deptTools.UpdateDepartment,
	})

	toolRegistry.Register(Tool{
		Name:        "delete_department",
		Description: "删除部门，需要提供部门ID",
		Parameters: []ToolParameter{
			{Name: "id", Type: "string", Description: "部门ID", Required: true},
		},
		Handler: deptTools.DeleteDepartment,
	})

	toolRegistry.Register(Tool{
		Name:        "get_department",
		Description: "获取部门详情，需要提供部门ID",
		Parameters: []ToolParameter{
			{Name: "id", Type: "string", Description: "部门ID", Required: true},
		},
		Handler: deptTools.GetDepartment,
	})

	toolRegistry.Register(Tool{
		Name:        "list_departments",
		Description: "列出所有部门，无需参数",
		Parameters:  []ToolParameter{},
		Handler:     deptTools.ListDepartments,
	})

	toolRegistry.Register(Tool{
		Name:        "search_departments",
		Description: "搜索部门，需要提供关键词",
		Parameters: []ToolParameter{
			{Name: "keyword", Type: "string", Description: "搜索关键词", Required: true},
		},
		Handler: deptTools.SearchDepartments,
	})
}

// registerRoleTools 注册角色相关工具
func registerRoleTools(toolRegistry *ToolRegistry, db *bun.DB) {
	roleTools := tools.NewRoleTools(system_repo.NewRoleRepository(db))

	toolRegistry.Register(Tool{
		Name:        "create_role",
		Description: "创建新角色，需要提供角色名称，可选描述",
		Parameters: []ToolParameter{
			{Name: "name", Type: "string", Description: "角色名称", Required: true},
			{Name: "description", Type: "string", Description: "角色描述", Required: false},
		},
		Handler: roleTools.CreateRole,
	})

	toolRegistry.Register(Tool{
		Name:        "update_role",
		Description: "更新角色信息，需要提供角色ID和要更新的内容",
		Parameters: []ToolParameter{
			{Name: "id", Type: "string", Description: "角色ID", Required: true},
			{Name: "name", Type: "string", Description: "新的角色名称", Required: false},
			{Name: "description", Type: "string", Description: "新的角色描述", Required: false},
		},
		Handler: roleTools.UpdateRole,
	})

	toolRegistry.Register(Tool{
		Name:        "delete_role",
		Description: "删除角色，需要提供角色ID",
		Parameters: []ToolParameter{
			{Name: "id", Type: "string", Description: "角色ID", Required: true},
		},
		Handler: roleTools.DeleteRole,
	})

	toolRegistry.Register(Tool{
		Name:        "get_role",
		Description: "获取角色详情，需要提供角色ID",
		Parameters: []ToolParameter{
			{Name: "id", Type: "string", Description: "角色ID", Required: true},
		},
		Handler: roleTools.GetRole,
	})

	toolRegistry.Register(Tool{
		Name:        "list_roles",
		Description: "列出所有角色，无需参数",
		Parameters:  []ToolParameter{},
		Handler:     roleTools.ListRoles,
	})

	toolRegistry.Register(Tool{
		Name:        "search_roles",
		Description: "搜索角色，需要提供关键词",
		Parameters: []ToolParameter{
			{Name: "keyword", Type: "string", Description: "搜索关键词", Required: true},
		},
		Handler: roleTools.SearchRoles,
	})
}
