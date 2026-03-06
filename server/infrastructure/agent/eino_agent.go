package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"sag-reg-server/infrastructure/llm"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
)

// 基于 Eino 框架的 Agent
type EinoAgent struct {
	runnable compose.Runnable[[]*schema.Message, []*schema.Message]
}

// 创建基于 Eino 的 Agent
func NewEinoAgent(llmClient llm.LLMClient, toolRegistry *ToolRegistry) (*EinoAgent, error) {
	ctx := context.Background()

	// 获取 ChatModel（需要是 EinoClient 类型）
	einoClient, ok := llmClient.(*llm.EinoClient)
	if !ok {
		return nil, fmt.Errorf("LLM 客户端必须是 EinoClient 类型")
	}
	chatModel := einoClient.GetChatModel()

	// 将工具转换为 eino 工具格式
	einoTools := make([]tool.BaseTool, 0)
	toolInfos := make([]*schema.ToolInfo, 0)

	for _, t := range toolRegistry.List() {
		// 创建工具信息
		params := make(map[string]*schema.ParameterInfo)
		for _, p := range t.Parameters {
			var paramType schema.DataType
			switch p.Type {
			case "string":
				paramType = schema.String
			case "integer", "int":
				paramType = schema.Integer
			case "number", "float":
				paramType = schema.Number
			case "boolean", "bool":
				paramType = schema.Boolean
			default:
				paramType = schema.String
			}

			params[p.Name] = &schema.ParameterInfo{
				Desc:     p.Description,
				Type:     paramType,
				Required: p.Required,
			}
		}

		toolInfo := &schema.ToolInfo{
			Name:        t.Name,
			Desc:        t.Description,
			ParamsOneOf: schema.NewParamsOneOfByParams(params),
		}

		// 创建工具包装器
		einoTool := newToolWrapper(t.Name, t.Handler, toolInfo)
		einoTools = append(einoTools, einoTool)
		toolInfos = append(toolInfos, toolInfo)
	}

	// 绑定工具到 ChatModel
	if err := chatModel.BindTools(toolInfos); err != nil {
		return nil, fmt.Errorf("绑定工具失败: %w", err)
	}

	// 创建工具节点
	toolsNode, err := compose.NewToolNode(ctx, &compose.ToolsNodeConfig{
		Tools: einoTools,
	})
	if err != nil {
		return nil, fmt.Errorf("创建工具节点失败: %w", err)
	}

	// 构建处理链
	chain := compose.NewChain[[]*schema.Message, []*schema.Message]()
	chain.
		AppendChatModel(chatModel, compose.WithNodeName("chat_model")).
		AppendToolsNode(toolsNode, compose.WithNodeName("tools"))

	// 编译链
	runnable, err := chain.Compile(ctx)
	if err != nil {
		return nil, fmt.Errorf("编译链失败: %w", err)
	}

	return &EinoAgent{
		runnable: runnable,
	}, nil
}

// 处理用户消息（兼容旧接口）
func (a *EinoAgent) Process(ctx context.Context, req AgentRequest) (AgentResponse, error) {
	log.Printf("🤖 Eino Agent 处理消息: %s", req.Message)

	// 构建消息列表
	messages := make([]*schema.Message, 0)

	// 添加历史消息
	for _, msg := range req.History {
		var role schema.RoleType
		switch msg.Role {
		case "user":
			role = schema.User
		case "assistant":
			role = schema.Assistant
		case "system":
			role = schema.System
		default:
			continue
		}
		messages = append(messages, &schema.Message{
			Role:    role,
			Content: msg.Content,
		})
	}

	// 添加当前用户消息
	messages = append(messages, &schema.Message{
		Role:    schema.User,
		Content: req.Message,
	})

	// 调用 agent
	resp, err := a.runnable.Invoke(ctx, messages)
	if err != nil {
		log.Printf("❌ Agent 调用失败: %v", err)
		return AgentResponse{
			Response: "抱歉，我现在无法处理你的请求。请稍后再试。",
		}, err
	}

	// 处理响应
	var response string
	var toolUsed string
	var toolCall *ToolCallInfo

	// 查找最后一个 assistant 消息
	for i := len(resp) - 1; i >= 0; i-- {
		if resp[i].Role == schema.Assistant {
			response = resp[i].Content
			break
		}
	}

	// 查找工具调用（查找 tool_calls）
	for _, msg := range resp {
		if len(msg.ToolCalls) > 0 {
			for _, tc := range msg.ToolCalls {
				toolUsed = tc.Function.Name
				// 解析参数
				var params map[string]interface{}
				if err := json.Unmarshal([]byte(tc.Function.Arguments), &params); err == nil {
					toolCall = &ToolCallInfo{
						ToolName: toolUsed,
						Input:    params,
						Success:  true,
					}
				}
			}
		}
	}

	// 如果没有找到响应，使用第一个消息
	if response == "" && len(resp) > 0 {
		response = resp[len(resp)-1].Content
	}

	return AgentResponse{
		Response:  response,
		ToolUsed:  toolUsed,
		ToolCall:  toolCall,
		SessionID: req.SessionID,
		Usage:     nil, // TODO: 从响应中提取 usage
	}, nil
}

// toolWrapper 工具包装器，将旧的工具接口适配到 eino 工具接口
type toolWrapper struct {
	name    string
	handler ToolHandler
	info    *schema.ToolInfo
}

func newToolWrapper(name string, handler ToolHandler, info *schema.ToolInfo) *toolWrapper {
	return &toolWrapper{
		name:    name,
		handler: handler,
		info:    info,
	}
}

func (tw *toolWrapper) Info(_ context.Context) (*schema.ToolInfo, error) {
	return tw.info, nil
}

func (tw *toolWrapper) InvokableRun(ctx context.Context, argumentsInJSON string, _ ...tool.Option) (string, error) {
	// 解析参数
	var params map[string]interface{}
	if err := json.Unmarshal([]byte(argumentsInJSON), &params); err != nil {
		return "", fmt.Errorf("解析参数失败: %w", err)
	}

	// 调用原始处理器
	result, err := tw.handler(ctx, params)
	if err != nil {
		return "", err
	}

	return result, nil
}
