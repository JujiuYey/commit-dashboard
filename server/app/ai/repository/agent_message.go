package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/uptrace/bun"

	ai_db "sag-reg-server/app/ai/models/db"
)

// 消息仓储
type AgentMessageRepository struct {
	db *bun.DB
}

func NewAgentMessageRepository(database *bun.DB) *AgentMessageRepository {
	return &AgentMessageRepository{db: database}
}

// 创建消息
func (r *AgentMessageRepository) Create(ctx context.Context, msg *ai_db.AgentMessage) (*ai_db.AgentMessage, error) {
	msg.ID = strings.ReplaceAll(uuid.New().String(), "-", "")

	_, err := r.db.NewInsert().Model(msg).Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("创建消息失败: %w", err)
	}

	return msg, nil
}

// 根据会话 ID 获取消息列表
func (r *AgentMessageRepository) ListBySessionID(ctx context.Context, sessionID string, limit, offset int) ([]*ai_db.AgentMessage, error) {
	var messages []*ai_db.AgentMessage

	err := r.db.NewSelect().
		Model(&messages).
		Where("session_id = ?", sessionID).
		Order("created_at ASC").
		Limit(limit).
		Offset(offset).
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("获取消息列表失败: %w", err)
	}

	return messages, nil
}
