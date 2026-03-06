package response

// AgentChatResponse 聊天响应
type AgentChatResponse struct {
	Response  string             `json:"response"`
	SessionID string             `json:"session_id,omitempty"`
	ToolUsed  string             `json:"tool_used,omitempty"`
	ToolCall  *AgentToolCallInfo `json:"tool_call,omitempty"`
	Usage     *Usage             `json:"usage,omitempty"`
}

// AgentToolCallInfo 工具调用信息
type AgentToolCallInfo struct {
	ToolName string         `json:"tool_name,omitempty"`
	Input    map[string]any `json:"input,omitempty"`
	Output   any            `json:"output,omitempty"`
	Error    string         `json:"error,omitempty"`
	Success  bool           `json:"success,omitempty"`
}

// AgentSessionListResponse 会话列表响应
type AgentSessionListResponse struct {
	Sessions []AgentSessionItem `json:"sessions"`
	Total    int                `json:"total"`
}

// AgentSessionItem 会话项
type AgentSessionItem struct {
	ID           string  `json:"id"`
	Title        *string `json:"title,omitempty"`
	MessageCount int     `json:"message_count"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

// AgentMessageItem 消息项
type AgentMessageItem struct {
	ID        string             `json:"id"`
	Role      string             `json:"role"`
	Content   string             `json:"content"`
	ToolUsed  *string            `json:"tool_used,omitempty"`
	ToolCall  *AgentToolCallInfo `json:"tool_call,omitempty"`
	Usage     *Usage             `json:"usage,omitempty"`
	CreatedAt string             `json:"created_at"`
}

// AgentHistoryResponse 历史消息响应
type AgentHistoryResponse struct {
	SessionID string             `json:"session_id"`
	Messages  []AgentMessageItem `json:"messages"`
}

// Usage Token 用量信息
type Usage struct {
	PromptTokens     int64 `json:"prompt_tokens"`
	CompletionTokens int64 `json:"completion_tokens"`
	TotalTokens      int64 `json:"total_tokens"`
}
