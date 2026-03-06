package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"sag-reg-server/infrastructure/llm"
)

// Agent 请求
type AgentRequest struct {
	Message   string        `json:"message"`
	SessionID string        `json:"session_id,omitempty"`
	History   []ChatMessage `json:"history,omitempty"`
}

// 工具调用信息
type ToolCallInfo struct {
	ToolName string                 `json:"tool_name,omitempty"`
	Input    map[string]interface{} `json:"input,omitempty"`
	Output   interface{}            `json:"output,omitempty"`
	Error    string                 `json:"error,omitempty"`
	Success  bool                   `json:"success,omitempty"`
}

// Agent 响应
type AgentResponse struct {
	Response  string        `json:"response"`
	ToolUsed  string        `json:"tool_used,omitempty"`
	ToolCall  *ToolCallInfo `json:"tool_call,omitempty"`
	SessionID string        `json:"session_id,omitempty"`
	Usage     *llm.Usage    `json:"usage,omitempty"` // Token 用量信息
}

// 聊天消息
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// Agent 核心处理器
type Agent struct {
	llmClient    llm.LLMClient
	toolRegistry *ToolRegistry
	einoAgent    *EinoAgent // 基于 Eino 的 Agent（如果可用）
}

// 创建 Agent 实例
func NewAgent(llmClient llm.LLMClient, toolRegistry *ToolRegistry) *Agent {
	return &Agent{
		llmClient:    llmClient,
		toolRegistry: toolRegistry,
	}
}

// 处理用户消息
func (a *Agent) Process(ctx context.Context, req AgentRequest) (AgentResponse, error) {
	// 如果存在 Eino Agent，优先使用
	if a.einoAgent != nil {
		return a.einoAgent.Process(ctx, req)
	}

	// 否则使用旧的实现
	log.Printf("🤖 Agent 处理消息（旧实现）: %s", req.Message)

	// 1. 构建系统提示词
	systemPrompt := a.buildSystemPrompt()

	// 2. 构建对话历史
	messages := a.buildMessages(systemPrompt, req.History, req.Message)

	// 3. 调用 LLM 决定要使用的工具
	decisionResp, err := a.llmClient.Chat(ctx, messages)
	if err != nil {
		log.Printf("❌ LLM 调用失败: %v", err)
		return AgentResponse{
			Response: "抱歉，我现在无法处理你的请求。请稍后再试。",
		}, err
	}

	// 4. 解析 LLM 的决策
	toolName, params := a.parseDecision(decisionResp.Text)

	// 5. 执行工具调用
	var response string
	var toolUsed string
	var toolCall *ToolCallInfo
	var usage *llm.Usage

	if toolName != "" && params != nil {
		log.Printf("🔧 执行工具: %s, 参数: %v", toolName, params)
		result := a.toolRegistry.Execute(ctx, toolName, params)
		toolUsed = toolName

		// 构建工具调用信息
		toolCall = &ToolCallInfo{
			ToolName: toolName,
			Input:    params,
			Success:  result.Success,
		}

		if result.Success {
			response = result.Result
			// 尝试解析结果为 JSON，如果失败则作为字符串
			var outputJSON interface{}
			if err := json.Unmarshal([]byte(result.Result), &outputJSON); err == nil {
				toolCall.Output = outputJSON
			} else {
				toolCall.Output = result.Result
			}
			// 使用决策阶段的 usage
			usage = &decisionResp.Usage
		} else {
			// 工具执行失败，尝试让 LLM 生成友好的错误消息
			errorResp := a.generateErrorResponse(ctx, req.Message, result.Error)
			response = errorResp.Text
			toolCall.Error = result.Error
			// 合并决策和错误响应的 usage
			usage = &llm.Usage{
				PromptTokens:     decisionResp.Usage.PromptTokens + errorResp.Usage.PromptTokens,
				CompletionTokens: decisionResp.Usage.CompletionTokens + errorResp.Usage.CompletionTokens,
				TotalTokens:      decisionResp.Usage.TotalTokens + errorResp.Usage.TotalTokens,
			}
		}
	} else {
		// 没有工具调用，直接使用 LLM 的回复
		response = strings.Trim(decisionResp.Text, " \n")
		usage = &decisionResp.Usage
	}

	return AgentResponse{
		Response:  response,
		ToolUsed:  toolUsed,
		ToolCall:  toolCall,
		SessionID: req.SessionID,
		Usage:     usage,
	}, nil
}

// buildSystemPrompt 构建系统提示词
func (a *Agent) buildSystemPrompt() string {
	toolsJSON := a.toolRegistry.GetToolsJSON()

	return fmt.Sprintf(`你是 Commit Dashboard 的智能分析助手，帮助用户分析代码提交记录、贡献者统计和仓库信息。

## 可用工具
你可以使用以下工具来完成用户的请求：

%s

## 工作流程
1. 仔细分析用户意图
2. 选择最合适的工具
3. 从用户输入中提取工具参数
4. 执行工具调用
5. 根据工具返回结果，用自然语言回复用户

## 重要规则
- 始终以 JSON 格式返回你的决策，格式如下：
  {"tool": "工具名称", "params": {"参数1": "值1", "参数2": "值2"}}
- 如果用户请求不明确，询问澄清问题
- 如果不确定参数值，使用你能找到的最佳猜测
- 如果没有合适的工具，直接回复用户

## 当前时间
2026年

请开始分析用户请求并做出决策。`, toolsJSON)
}

// buildMessages 构建发送给 LLM 的消息列表
func (a *Agent) buildMessages(systemPrompt string, history []ChatMessage, currentMessage string) []llm.ChatMessage {
	messages := make([]llm.ChatMessage, 0, len(history)+2)

	// 添加系统提示词
	messages = append(messages, llm.ChatMessage{
		Role:    "system",
		Content: systemPrompt,
	})

	// 添加历史消息
	for _, msg := range history {
		messages = append(messages, llm.ChatMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	// 添加当前用户消息
	messages = append(messages, llm.ChatMessage{
		Role:    "user",
		Content: currentMessage,
	})

	return messages
}

// parseDecision 解析 LLM 的决策
func (a *Agent) parseDecision(decision string) (string, map[string]interface{}) {
	// 尝试解析 JSON
	var parsed struct {
		Tool   string                 `json:"tool"`
		Params map[string]interface{} `json:"params"`
	}

	// 清理 JSON（移除可能的 markdown 代码块标记和前后文本）
	jsonStr := strings.TrimSpace(decision)

	// 移除 markdown 代码块标记
	jsonStr = strings.TrimPrefix(jsonStr, "```json")
	jsonStr = strings.TrimPrefix(jsonStr, "```")
	jsonStr = strings.TrimSuffix(jsonStr, "```")
	jsonStr = strings.TrimSpace(jsonStr)

	// 尝试提取 JSON 对象（查找第一个 { 到最后一个 }）
	startIdx := strings.Index(jsonStr, "{")
	endIdx := strings.LastIndex(jsonStr, "}")

	if startIdx != -1 && endIdx != -1 && endIdx > startIdx {
		jsonStr = jsonStr[startIdx : endIdx+1]
	}

	if err := json.Unmarshal([]byte(jsonStr), &parsed); err != nil {
		log.Printf("⚠️  解析决策 JSON 失败: %v，原始决策: %s", err, decision)
		log.Printf("⚠️  清理后的 JSON: %s", jsonStr)
		// 尝试从文本中提取工具名
		return "", nil
	}

	return parsed.Tool, parsed.Params
}

// generateErrorResponse 生成错误响应
func (a *Agent) generateErrorResponse(ctx context.Context, originalRequest string, errorMsg string) *llm.GenerateResponse {
	prompt := fmt.Sprintf(`用户请求: %s

工具执行失败，错误信息: %s

请用友好、简洁的方式向用户解释这个错误，并提供建议。`, originalRequest, errorMsg)

	resp, err := a.llmClient.Generate(ctx, prompt)
	if err != nil {
		return &llm.GenerateResponse{
			Text: fmt.Sprintf("抱歉，操作失败了：%s", errorMsg),
			Usage: llm.Usage{},
		}
	}

	return resp
}
