package handlers

import (
	"context"
	"log"
	"strconv"

	"github.com/gofiber/fiber/v2"

	"sag-reg-server/common/response"
	ai_db "sag-reg-server/app/ai/models/db"
	ai_req "sag-reg-server/app/ai/models/request"
	ai_res "sag-reg-server/app/ai/models/response"
	"sag-reg-server/app/ai/repository"
	"sag-reg-server/infrastructure/agent"
)

type AgentHandler struct {
	sessions *repository.AgentSessionRepository
	messages *repository.AgentMessageRepository
	agent    *agent.Agent
}

func NewAgentHandler(sessions *repository.AgentSessionRepository, messages *repository.AgentMessageRepository, agentInstance *agent.Agent) *AgentHandler {
	return &AgentHandler{
		sessions: sessions,
		messages: messages,
		agent:    agentInstance,
	}
}

// 从请求头获取 Gitea 用户 ID
func getUserID(c *fiber.Ctx) (int64, error) {
	userIDStr := c.Get("X-User-Id")
	if userIDStr == "" {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "缺少 X-User-Id")
	}
	return strconv.ParseInt(userIDStr, 10, 64)
}

// 聊天接口
func (h *AgentHandler) Chat(c *fiber.Ctx) error {
	var req ai_req.AgentChatRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequestCtx(c)
	}

	userID, err := getUserID(c)
	if err != nil {
		return response.UnauthorizedCtx(c, "无效的用户ID")
	}

	// 获取或创建会话
	sessionID := req.SessionID
	if sessionID == "" {
		session, err := h.sessions.Create(c.Context(), userID)
		if err != nil {
			log.Printf("❌ 创建会话失败: %v", err)
			return response.InternalServerCtx(c, "创建会话失败")
		}
		sessionID = session.ID
	}

	// 保存用户消息
	_, err = h.messages.Create(c.Context(), &ai_db.AgentMessage{
		SessionID: sessionID,
		Role:      "user",
		Content:   req.Message,
	})
	if err != nil {
		log.Printf("⚠️  保存用户消息失败: %v", err)
	}

	// 加载历史消息
	history := h.loadHistory(c.Context(), sessionID)

	// 调用 Agent
	result, err := h.agent.Process(c.Context(), agent.AgentRequest{
		Message:   req.Message,
		SessionID: sessionID,
		History:   history,
	})
	if err != nil {
		log.Printf("❌ Agent 处理失败: %v", err)
		return response.InternalServerCtx(c, "处理失败")
	}

	// 构建 usage
	var usage *ai_res.Usage
	var promptTokens, completionTokens, totalTokens *int64
	if result.Usage != nil {
		usage = &ai_res.Usage{
			PromptTokens:     result.Usage.PromptTokens,
			CompletionTokens: result.Usage.CompletionTokens,
			TotalTokens:      result.Usage.TotalTokens,
		}
		promptTokens = &result.Usage.PromptTokens
		completionTokens = &result.Usage.CompletionTokens
		totalTokens = &result.Usage.TotalTokens
	}

	// 保存 AI 回复
	var toolUsed *string
	if result.ToolUsed != "" {
		toolUsed = &result.ToolUsed
	}
	_, err = h.messages.Create(c.Context(), &ai_db.AgentMessage{
		SessionID:        sessionID,
		Role:             "assistant",
		Content:          result.Response,
		ToolUsed:         toolUsed,
		PromptTokens:     promptTokens,
		CompletionTokens: completionTokens,
		TotalTokens:      totalTokens,
	})
	if err != nil {
		log.Printf("⚠️  保存 AI 回复失败: %v", err)
	}

	// 转换 tool call 信息
	var toolCall *ai_res.AgentToolCallInfo
	if result.ToolCall != nil {
		toolCall = &ai_res.AgentToolCallInfo{
			ToolName: result.ToolCall.ToolName,
			Input:    result.ToolCall.Input,
			Output:   result.ToolCall.Output,
			Error:    result.ToolCall.Error,
			Success:  result.ToolCall.Success,
		}
	}

	return response.SuccessCtx(c, ai_res.AgentChatResponse{
		Response:  result.Response,
		SessionID: sessionID,
		ToolUsed:  result.ToolUsed,
		ToolCall:  toolCall,
		Usage:     usage,
	})
}

// 获取会话列表
func (h *AgentHandler) ListSessions(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return response.UnauthorizedCtx(c, "无效的用户ID")
	}

	var req ai_req.AgentSessionListRequest
	if err := c.QueryParser(&req); err != nil {
		return response.BadRequestCtx(c)
	}
	if req.Limit == 0 {
		req.Limit = 20
	}

	sessions, total, err := h.sessions.List(c.Context(), userID, req.Limit, req.Offset)
	if err != nil {
		return response.InternalServerCtx(c, "获取会话列表失败")
	}

	items := make([]ai_res.AgentSessionItem, 0, len(sessions))
	for _, s := range sessions {
		items = append(items, ai_res.AgentSessionItem{
			ID:           s.ID,
			Title:        s.Title,
			MessageCount: s.MessageCount,
			CreatedAt:    s.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt:    s.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return response.SuccessCtx(c, ai_res.AgentSessionListResponse{
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

	messages, err := h.messages.ListBySessionID(c.Context(), sessionID, 100, 0)
	if err != nil {
		return response.InternalServerCtx(c, "获取消息列表失败")
	}

	items := make([]ai_res.AgentMessageItem, 0, len(messages))
	for _, msg := range messages {
		var usage *ai_res.Usage
		if msg.PromptTokens != nil && msg.CompletionTokens != nil && msg.TotalTokens != nil {
			usage = &ai_res.Usage{
				PromptTokens:     *msg.PromptTokens,
				CompletionTokens: *msg.CompletionTokens,
				TotalTokens:      *msg.TotalTokens,
			}
		}

		var toolCall *ai_res.AgentToolCallInfo
		if msg.ToolResult != nil {
			toolCall = &ai_res.AgentToolCallInfo{}
			if toolName, ok := msg.ToolResult["tool_name"].(string); ok {
				toolCall.ToolName = toolName
			}
			if input, ok := msg.ToolResult["input"].(map[string]interface{}); ok {
				toolCall.Input = input
			}
			if output, ok := msg.ToolResult["output"]; ok {
				toolCall.Output = output
			}
			if errStr, ok := msg.ToolResult["error"].(string); ok {
				toolCall.Error = errStr
			}
			if success, ok := msg.ToolResult["success"].(bool); ok {
				toolCall.Success = success
			}
		}

		items = append(items, ai_res.AgentMessageItem{
			ID:        msg.ID,
			Role:      msg.Role,
			Content:   msg.Content,
			ToolUsed:  msg.ToolUsed,
			ToolCall:  toolCall,
			Usage:     usage,
			CreatedAt: msg.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return response.SuccessCtx(c, ai_res.AgentHistoryResponse{
		SessionID: sessionID,
		Messages:  items,
	})
}

// 删除会话
func (h *AgentHandler) DeleteSession(c *fiber.Ctx) error {
	sessionID := c.Params("session_id")
	if sessionID == "" {
		return response.BadRequestCtx(c, "会话ID不能为空")
	}

	if err := h.sessions.Delete(c.Context(), sessionID); err != nil {
		return response.InternalServerCtx(c, "删除会话失败")
	}

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

	if err := h.sessions.UpdateTitle(c.Context(), sessionID, req.Title); err != nil {
		return response.InternalServerCtx(c, "更新会话标题失败")
	}

	return response.SuccessMsgCtx(c, "会话标题更新成功")
}

// 加载会话历史
func (h *AgentHandler) loadHistory(ctx context.Context, sessionID string) []agent.ChatMessage {
	messages, err := h.messages.ListBySessionID(ctx, sessionID, 10, 0)
	if err != nil {
		log.Printf("⚠️  获取历史消息失败: %v", err)
		return nil
	}

	history := make([]agent.ChatMessage, 0, len(messages))
	for _, msg := range messages {
		history = append(history, agent.ChatMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	return history
}
