package db

import (
	"time"

	"github.com/uptrace/bun"
)

// 对话消息模型
type AgentMessage struct {
	bun.BaseModel `bun:"table:ai_agent_messages,alias:am"`

	ID               string                 `bun:"id,pk,type:varchar(32)" json:"id"`
	SessionID        string                 `bun:"session_id,notnull" json:"session_id"`
	Role             string                 `bun:"role,notnull" json:"role"`
	Content          string                 `bun:"content,notnull" json:"content"`
	ToolUsed         *string                `bun:"tool_used" json:"tool_used,omitempty"`
	ToolResult       map[string]interface{} `bun:"tool_result,type:jsonb" json:"tool_result,omitempty"`
	PromptTokens     *int64                 `bun:"prompt_tokens" json:"prompt_tokens,omitempty"`
	CompletionTokens *int64                 `bun:"completion_tokens" json:"completion_tokens,omitempty"`
	TotalTokens      *int64                 `bun:"total_tokens" json:"total_tokens,omitempty"`
	CreatedAt        time.Time              `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`

	Session *AgentSession `bun:"rel:belongs-to,join:session_id=id" json:"session,omitempty"`
}
