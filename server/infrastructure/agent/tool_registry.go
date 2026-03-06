package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
)

// 工具参数定义
type ToolParameter struct {
	Name        string      `json:"name"`
	Type        string      `json:"type"`
	Description string      `json:"description"`
	Required    bool        `json:"required"`
	Default     interface{} `json:"default,omitempty"`
}

// 工具定义
type Tool struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Parameters  []ToolParameter `json:"parameters"`
	Handler     ToolHandler     `json:"-"`
}

// 工具处理器函数类型
type ToolHandler func(ctx context.Context, params map[string]interface{}) (string, error)

// 工具执行结果
type ToolResult struct {
	Success  bool        `json:"success"`
	Result   string      `json:"result,omitempty"`
	Error    string      `json:"error,omitempty"`
	ToolName string      `json:"tool_name"`
	Params   interface{} `json:"params,omitempty"`
}

// 工具注册中心
type ToolRegistry struct {
	tools map[string]Tool
}

// 创建工具注册中心
func NewToolRegistry() *ToolRegistry {
	registry := &ToolRegistry{
		tools: make(map[string]Tool),
	}
	return registry
}

// 注册工具
func (r *ToolRegistry) Register(tool Tool) {
	r.tools[tool.Name] = tool
	log.Printf("✅ 工具已注册: %s", tool.Name)
}

// 获取工具
func (r *ToolRegistry) Get(name string) (Tool, bool) {
	tool, ok := r.tools[name]
	return tool, ok
}

// 获取所有工具
func (r *ToolRegistry) List() []Tool {
	tools := make([]Tool, 0, len(r.tools))
	for _, tool := range r.tools {
		tools = append(tools, tool)
	}
	return tools
}

// 执行工具
func (r *ToolRegistry) Execute(ctx context.Context, name string, params map[string]interface{}) ToolResult {
	tool, ok := r.Get(name)
	if !ok {
		return ToolResult{
			Success:  false,
			Error:    fmt.Sprintf("工具不存在: %s", name),
			ToolName: name,
		}
	}

	// 验证必填参数
	for _, param := range tool.Parameters {
		if param.Required {
			if _, exists := params[param.Name]; !exists && param.Default == nil {
				return ToolResult{
					Success:  false,
					Error:    fmt.Sprintf("缺少必填参数: %s", param.Name),
					ToolName: name,
					Params:   params,
				}
			}
		}
	}

	// 执行工具
	result, err := tool.Handler(ctx, params)
	if err != nil {
		log.Printf("❌ 工具执行失败: %s - %v", name, err)
		return ToolResult{
			Success:  false,
			Error:    err.Error(),
			ToolName: name,
			Params:   params,
		}
	}

	return ToolResult{
		Success:  true,
		Result:   result,
		ToolName: name,
		Params:   params,
	}
}

// 获取工具列表的 JSON 描述（用于 LLM）
func (r *ToolRegistry) GetToolsJSON() string {
	tools := r.List()
	if len(tools) == 0 {
		return "[]"
	}

	jsonBytes, err := json.Marshal(tools)
	if err != nil {
		log.Printf("❌ 序列化工具列表失败: %v", err)
		return "[]"
	}

	return string(jsonBytes)
}
