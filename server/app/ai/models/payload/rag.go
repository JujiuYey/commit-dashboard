package payload

import "sag-reg-server/infrastructure/llm"

// 用量信息
type Usage struct {
	PromptTokens     int64 `json:"prompt_tokens"`     // 输入 token 数
	CompletionTokens int64 `json:"completion_tokens"` // 输出 token 数
	TotalTokens      int64 `json:"total_tokens"`      // 总 token 数
}

// 检索到的文档片段
type RetrievedChunk struct {
	ChunkID         int    `json:"chunk_id"`          // ID
	Content         string `json:"content"`           // 文本内容
	DocumentID      string `json:"document_id"`       // 文档 ID
	Filename        string `json:"filename"`          // 文件名
	FolderID string `json:"folder_id"` // 知识库 ID
}

// 聊天请求
type RagChatRequest struct {
	Message         string  `json:"message" binding:"required"`
	SessionID       *string `json:"session_id,omitempty"`                 // 可选的会话 ID
	FolderID string  `json:"folder_id" binding:"required"` // 知识库 ID
	DocumentID      *string `json:"document_id,omitempty"`                // 可选：针对特定文档提问
}

// 聊天响应
type RagChatResponse struct {
	Response        string           `json:"response"`
	SessionID       string           `json:"session_id"`
	RetrievedChunks []RetrievedChunk `json:"retrieved_chunks,omitempty"` // 检索到的文档片段
	RelevanceScore  *float64         `json:"relevance_score,omitempty"`  // 相关性分数
	Usage           *Usage           `json:"usage,omitempty"`            // 用量信息
}

// 会话列表请求
type RagSessionListRequest struct {
	FolderID *string `json:"folder_id,omitempty"` // 可选：按知识库过滤
	Limit           int     `json:"limit,omitempty"`
	Offset          int     `json:"offset,omitempty"`
}

// 会话列表响应
type RagSessionListResponse struct {
	Sessions []RagSessionItem `json:"sessions"`
	Total    int              `json:"total"`
}

// 会话项
type RagSessionItem struct {
	ID              string  `json:"id"`
	Title           *string `json:"title,omitempty"`
	FolderID string  `json:"folder_id"`
	DocumentID      *string `json:"document_id,omitempty"`
	MessageCount    int     `json:"message_count"`
	TotalTokens     *int64  `json:"total_tokens,omitempty"` // 会话总 token 消耗
	CreatedAt       string  `json:"created_at"`
	UpdatedAt       string  `json:"updated_at"`
}

// 历史消息响应
type RagHistoryResponse struct {
	SessionID   string           `json:"session_id"`
	Messages    []RagMessageItem `json:"messages"`
	Total       int              `json:"total"`
	TotalTokens *int64           `json:"total_tokens,omitempty"` // 会话总 token 消耗
}

// 消息项
type RagMessageItem struct {
	ID              string           `json:"id"`
	Role            string           `json:"role"`
	Content         string           `json:"content"`
	RetrievedChunks []RetrievedChunk `json:"retrieved_chunks,omitempty"`
	RelevanceScore  *float64         `json:"relevance_score,omitempty"`
	Usage           *Usage           `json:"usage,omitempty"` // 用量信息
	CreatedAt       string           `json:"created_at"`
}

// 查询响应
type QueryResponse struct {
	Answer  string     `json:"answer"`
	Sources []Source   `json:"sources"`
	Usage   *llm.Usage `json:"usage,omitempty"` // 用量信息
}

// 来源信息
type Source struct {
	Content  string         `json:"content"`
	Metadata map[string]any `json:"metadata"`
}
