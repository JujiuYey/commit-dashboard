package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/uptrace/bun"

	ai_db "sag-reg-server/app/ai/models/db"
)

// 会话仓储
type AgentSessionRepository struct {
	db *bun.DB
}

func NewAgentSessionRepository(database *bun.DB) *AgentSessionRepository {
	return &AgentSessionRepository{db: database}
}

// 创建会话
func (r *AgentSessionRepository) Create(ctx context.Context, userID int64) (*ai_db.AgentSession, error) {
	session := &ai_db.AgentSession{
		ID:     strings.ReplaceAll(uuid.New().String(), "-", ""),
		UserID: userID,
	}

	_, err := r.db.NewInsert().Model(session).Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("创建会话失败: %w", err)
	}

	return session, nil
}

// 根据 ID 获取会话
func (r *AgentSessionRepository) FindOne(ctx context.Context, id string) (*ai_db.AgentSession, error) {
	session := new(ai_db.AgentSession)
	err := r.db.NewSelect().
		Model(session).
		Where("id = ?", id).
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("获取会话失败: %w", err)
	}
	return session, nil
}

// 列出用户的会话
func (r *AgentSessionRepository) List(ctx context.Context, userID int64, limit, offset int) ([]*ai_db.AgentSession, int, error) {
	var sessions []*ai_db.AgentSession

	query := r.db.NewSelect().
		Model(&sessions).
		Where("user_id = ?", userID)

	total, err := query.Count(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("获取会话总数失败: %w", err)
	}

	err = query.
		Order("updated_at DESC").
		Limit(limit).
		Offset(offset).
		Scan(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("列出会话失败: %w", err)
	}

	return sessions, total, nil
}

// 更新会话标题
func (r *AgentSessionRepository) UpdateTitle(ctx context.Context, id string, title string) error {
	_, err := r.db.NewUpdate().
		Model((*ai_db.AgentSession)(nil)).
		Set("title = ?", title).
		Where("id = ?", id).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("更新会话标题失败: %w", err)
	}
	return nil
}

// 删除会话（消息会被级联删除）
func (r *AgentSessionRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.NewDelete().
		Model((*ai_db.AgentSession)(nil)).
		Where("id = ?", id).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("删除会话失败: %w", err)
	}
	return nil
}
