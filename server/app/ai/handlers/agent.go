package handlers

import (
	"context"
	"log"

	"github.com/gofiber/fiber/v2"

	"sag-reg-server/common/response"
	"sag-reg-server/infrastructure/agent"
	"sag-reg-server/infrastructure/database"
	ai_payload "sag-reg-server/app/ai/models/payload"
)

// 处理器
type AgentHandler struct {
	dbService *database.DatabaseService
	agent     *agent.Agent
}

// 创建 Agent 处理器
func NewAgentHandler(dbService *database.DatabaseService, agentInstance *agent.Agent) *AgentHandler {
	return &AgentHandler{
		dbService: dbService,
		agent:     agentInstance,
	}
}

// 聊天接口
func (h *AgentHandler) Chat(c *fiber.Ctx) error {
	var req ai_payload.AgentChatRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequestCtx(c)
	}

	log.Printf("📝 用户消息: %s", req.Message)

	// 获取当前用户ID（从认证中间件获取）
	userID := c.Locals("user_id")
	var userIDStr *string
	if userID != nil {
		if uid, ok := userID.(string); ok {
			userIDStr = &uid
		}
	}

	// 1. 获取或创建会话
	sessionID := req.SessionID
	if sessionID == "" {
		session, err := h.dbService.AgentSessions.Create(c.Context(), userIDStr)
		if err != nil {
			log.Printf("❌ 创建会话失败: %v", err)
			return response.InternalServerCtx(c, "创建会话失败")
		}
		sessionID = session.ID
		log.Printf("✅ 会话已创建，ID: %s", sessionID)
	}

	// 2. 保存用户消息
	_, err := h.dbService.AgentMessages.Create(c.Context(), sessionID, "user", req.Message, nil, nil, nil, nil, nil)
	if err != nil {
		log.Printf("⚠️  保存用户消息失败: %v", err)
	}

	// 3. 加载历史消息
	history := h.loadHistory(c.Context(), sessionID)

	// 4. 调用 Agent 处理
	result, err := h.agent.Process(c.Context(), agent.AgentRequest{
		Message:   req.Message,
		SessionID: sessionID,
		History:   history,
	})

	if err != nil {
		log.Printf("❌ Agent 处理失败: %v", err)
		return response.InternalServerCtx(c, "处理失败")
	}

	log.Printf("✅ Agent 回复: %s", result.Response)
	log.Printf("🔧 使用工具: %s", result.ToolUsed)

	// 转换 usage 信息
	var usage *ai_payload.Usage
	var promptTokens, completionTokens, totalTokens *int64
	if result.Usage != nil {
		usage = &ai_payload.Usage{
			PromptTokens:     result.Usage.PromptTokens,
			CompletionTokens: result.Usage.CompletionTokens,
			TotalTokens:      result.Usage.TotalTokens,
		}
		promptTokens = &result.Usage.PromptTokens
		completionTokens = &result.Usage.CompletionTokens
		totalTokens = &result.Usage.TotalTokens
	}

	// 5. 保存 AI 回复（包含 usage 信息）
	var toolUsed *string
	if result.ToolUsed != "" {
		toolUsed = &result.ToolUsed
	}
	_, err = h.dbService.AgentMessages.Create(c.Context(), sessionID, "assistant", result.Response, toolUsed, nil, promptTokens, completionTokens, totalTokens)
	if err != nil {
		log.Printf("⚠️  保存 AI 回复失败: %v", err)
	}

	// 转换 tool call 信息
	var toolCall *ai_payload.AgentToolCallInfo
	if result.ToolCall != nil {
		toolCall = &ai_payload.AgentToolCallInfo{
			ToolName: result.ToolCall.ToolName,
			Input:    result.ToolCall.Input,
			Output:   result.ToolCall.Output,
			Error:    result.ToolCall.Error,
			Success:  result.ToolCall.Success,
		}
	}

	return response.SuccessCtx(c, ai_payload.AgentChatResponse{
		Response:  result.Response,
		SessionID: sessionID,
		ToolUsed:  result.ToolUsed,
		ToolCall:  toolCall,
		Usage:     usage,
	})
}

// 获取会话列表
func (h *AgentHandler) ListSessions(c *fiber.Ctx) error {
	log.Println("📋 获取 Agent 会话列表")

	// 获取当前用户ID
	userID := c.Locals("user_id")
	if userID == nil {
		return response.UnauthorizedCtx(c, "未授权")
	}
	userIDStr := userID.(string)

	var req ai_payload.AgentSessionListRequest
	if err := c.QueryParser(&req); err != nil {
		return response.BadRequestCtx(c)
	}

	// 设置默认值
	if req.Limit == 0 {
		req.Limit = 20
	}

	// 获取会话列表
	sessions, total, err := h.dbService.AgentSessions.List(c.Context(), userIDStr, req.Limit, req.Offset)
	if err != nil {
		log.Printf("❌ 获取会话列表失败: %v", err)
		return response.InternalServerCtx(c, "获取会话列表失败")
	}

	// 转换为响应格式
	items := make([]ai_payload.AgentSessionItem, 0, len(sessions))
	for _, session := range sessions {
		items = append(items, ai_payload.AgentSessionItem{
			ID:           session.ID,
			Title:        session.Title,
			MessageCount: session.MessageCount,
			CreatedAt:    session.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt:    session.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return response.SuccessCtx(c, ai_payload.AgentSessionListResponse{
		Sessions: items,
		Total:    total,
	})
}

// 获取会话历史
func (h *AgentHandler) History(c *fiber.Ctx) error {
	sessionID := c.Params("session_id")
	if sessionID == "" {
		return response.BadRequestCtx(c, "缺少会话ID")
	}

	// 获取消息列表
	messages, err := h.dbService.AgentMessages.ListBySessionID(c.Context(), sessionID, 100, 0)
	if err != nil {
		log.Printf("❌ 获取消息列表失败: %v", err)
		return response.InternalServerCtx(c, "获取消息列表失败")
	}

	// 转换为响应格式
	items := make([]ai_payload.AgentMessageItem, 0, len(messages))
	for _, msg := range messages {
		// 转换 usage 信息
		var usage *ai_payload.Usage
		if msg.PromptTokens != nil && msg.CompletionTokens != nil && msg.TotalTokens != nil {
			usage = &ai_payload.Usage{
				PromptTokens:     *msg.PromptTokens,
				CompletionTokens: *msg.CompletionTokens,
				TotalTokens:      *msg.TotalTokens,
			}
		}

		// 转换 tool call 信息
		var toolCall *ai_payload.AgentToolCallInfo
		if msg.ToolResult != nil {
			toolCall = &ai_payload.AgentToolCallInfo{}
			if toolName, ok := msg.ToolResult["tool_name"].(string); ok {
				toolCall.ToolName = toolName
			}
			if input, ok := msg.ToolResult["input"].(map[string]interface{}); ok {
				toolCall.Input = input
			}
			if output, ok := msg.ToolResult["output"]; ok {
				toolCall.Output = output
			}
			if err, ok := msg.ToolResult["error"].(string); ok {
				toolCall.Error = err
			}
			if success, ok := msg.ToolResult["success"].(bool); ok {
				toolCall.Success = success
			}
		}

		items = append(items, ai_payload.AgentMessageItem{
			ID:        msg.ID,
			Role:      msg.Role,
			Content:   msg.Content,
			ToolUsed:  msg.ToolUsed,
			ToolCall:  toolCall,
			Usage:     usage,
			CreatedAt: msg.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return response.SuccessCtx(c, ai_payload.AgentHistoryResponse{
		SessionID: sessionID,
		Messages:  items,
	})
}

// loadHistory 加载会话历史
func (h *AgentHandler) loadHistory(ctx context.Context, sessionID string) []agent.ChatMessage {
	// 获取最近的 10 条消息
	messages, err := h.dbService.AgentMessages.ListBySessionID(ctx, sessionID, 10, 0)
	if err != nil {
		log.Printf("⚠️  获取历史消息失败: %v", err)
		return nil
	}

	history := make([]agent.ChatMessage, 0, len(messages))
	for _, msg := range messages {
		role := "user"
		if msg.Role == "assistant" {
			role = "assistant"
		}
		history = append(history, agent.ChatMessage{
			Role:    role,
			Content: msg.Content,
		})
	}

	return history
}

// 删除会话
func (h *AgentHandler) DeleteSession(c *fiber.Ctx) error {
	sessionID := c.Params("session_id")
	if sessionID == "" {
		return response.BadRequestCtx(c, "会话ID不能为空")
	}

	ctx := c.Context()

	// 删除会话
	if err := h.dbService.AgentSessions.Delete(ctx, sessionID); err != nil {
		log.Printf("❌ 删除会话失败: %v", err)
		return response.InternalServerCtx(c, "删除会话失败")
	}

	// 删除会话相关的消息
	messages, err := h.dbService.AgentMessages.ListBySessionID(ctx, sessionID, 1000, 0)
	if err != nil {
		log.Printf("⚠️  获取会话消息失败: %v", err)
	} else {
		for _, msg := range messages {
			if delErr := h.dbService.AgentMessages.Delete(ctx, msg.ID); delErr != nil {
				log.Printf("⚠️  删除消息失败: %v", delErr)
			}
		}
	}

	log.Printf("✅ 会话删除成功: %s", sessionID)
	return response.SuccessMsgCtx(c, "会话删除成功")
}

// 更新会话标题
func (h *AgentHandler) UpdateSessionTitle(c *fiber.Ctx) error {
	sessionID := c.Params("session_id")
	if sessionID == "" {
		return response.BadRequestCtx(c, "会话ID不能为空")
	}

	var req struct {
		Title string `json:"title"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequestCtx(c)
	}

	if req.Title == "" {
		return response.BadRequestCtx(c, "标题不能为空")
	}

	ctx := c.Context()

	// 更新会话标题
	if err := h.dbService.AgentSessions.UpdateTitle(ctx, sessionID, req.Title); err != nil {
		log.Printf("❌ 更新会话标题失败: %v", err)
		return response.InternalServerCtx(c, "更新会话标题失败")
	}

	log.Printf("✅ 会话标题更新成功: %s -> %s", sessionID, req.Title)
	return response.SuccessMsgCtx(c, "会话标题更新成功")
}
