package db

import (
	"time"

	"github.com/uptrace/bun"
)

// 对话会话模型
type AgentSession struct {
	bun.BaseModel `bun:"table:ai_agent_sessions,alias:as"`

	ID           string    `bun:"id,pk,type:varchar(32)" json:"id"`
	Title        *string   `bun:"title" json:"title,omitempty"`
	UserID       int64     `bun:"user_id,notnull" json:"user_id"`
	MessageCount int       `bun:"message_count" json:"message_count"`
	CreatedAt    time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt    time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`

	Messages []*AgentMessage `bun:"rel:has-many,join:id=session_id" json:"messages,omitempty"`
}
