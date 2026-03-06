package request

// AgentChatRequest 聊天请求
type AgentChatRequest struct {
	Message   string `json:"message" binding:"required"`
	SessionID string `json:"session_id,omitempty"`
}

// AgentSessionListRequest 会话列表请求
type AgentSessionListRequest struct {
	Limit  int `json:"limit,omitempty"`
	Offset int `json:"offset,omitempty"`
}
