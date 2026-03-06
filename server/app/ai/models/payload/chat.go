package payload

import wiki_db "sag-reg-server/app/wiki/models/db"

// 聊天消息请求
type ChatMessageRequest struct {
	Role    string `json:"role"` // "user" 或 "assistant"
	Content string `json:"content"`
}

// 聊天请求
type ChatRequest struct {
	Message   string               `json:"message" binding:"required"`
	History   []ChatMessageRequest `json:"history"`
	SessionID *string              `json:"session_id,omitempty"` // 可选的会话 ID
}

// 聊天响应
type ChatResponse struct {
	Response  string             `json:"response"`
	Sources   []wiki_db.Document `json:"sources,omitempty"`    // 添加来源信息
	SessionID string             `json:"session_id,omitempty"` // 添加会话 ID
}

// 聊天请求
type AgentChatRequest struct {
	Message   string `json:"message" binding:"required"`
	SessionID string `json:"session_id,omitempty"`
}

// 工具调用信息
type AgentToolCallInfo struct {
	ToolName string                 `json:"tool_name,omitempty"`
	Input    map[string]interface{} `json:"input,omitempty"`
	Output   interface{}            `json:"output,omitempty"`
	Error    string                 `json:"error,omitempty"`
	Success  bool                   `json:"success,omitempty"`
}

// 聊天响应
type AgentChatResponse struct {
	Response  string             `json:"response"`
	SessionID string             `json:"session_id,omitempty"`
	ToolUsed  string             `json:"tool_used,omitempty"`
	ToolCall  *AgentToolCallInfo `json:"tool_call,omitempty"`
	Usage     *Usage             `json:"usage,omitempty"` // 用量信息
}

// 会话列表请求
type AgentSessionListRequest struct {
	Limit  int `json:"limit,omitempty"`
	Offset int `json:"offset,omitempty"`
}

// 会话列表响应
type AgentSessionListResponse struct {
	Sessions []AgentSessionItem `json:"sessions"`
	Total    int                `json:"total"`
}

// 会话项
type AgentSessionItem struct {
	ID           string  `json:"id"`
	Title        *string `json:"title,omitempty"`
	MessageCount int     `json:"message_count"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

// 消息项
type AgentMessageItem struct {
	ID        string             `json:"id"`
	Role      string             `json:"role"`
	Content   string             `json:"content"`
	ToolUsed  *string            `json:"tool_used,omitempty"`
	ToolCall  *AgentToolCallInfo `json:"tool_call,omitempty"`
	Usage     *Usage             `json:"usage,omitempty"` // 用量信息
	CreatedAt string             `json:"created_at"`
}

// 历史消息响应
type AgentHistoryResponse struct {
	SessionID string             `json:"session_id"`
	Messages  []AgentMessageItem `json:"messages"`
}
