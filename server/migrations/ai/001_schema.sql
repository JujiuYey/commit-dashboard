-- ============================================
-- AI 模块数据库架构
-- ============================================

-- 1. Agent 会话表 (ai_agent_sessions)
CREATE TABLE ai_agent_sessions (
    id VARCHAR(32) PRIMARY KEY,
    title VARCHAR(255),
    user_id BIGINT NOT NULL,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_sessions_user_id ON ai_agent_sessions(user_id);
CREATE INDEX idx_agent_sessions_updated_at ON ai_agent_sessions(updated_at DESC);

COMMENT ON TABLE ai_agent_sessions IS 'Agent 对话会话表';
COMMENT ON COLUMN ai_agent_sessions.user_id IS 'Gitea 用户 ID';
COMMENT ON COLUMN ai_agent_sessions.message_count IS '消息计数（冗余字段）';

-- 2. Agent 消息表 (ai_agent_messages)
CREATE TABLE ai_agent_messages (
    id VARCHAR(32) PRIMARY KEY,
    session_id VARCHAR(32) NOT NULL REFERENCES ai_agent_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    tool_used VARCHAR(100),
    tool_result JSONB,
    prompt_tokens BIGINT,
    completion_tokens BIGINT,
    total_tokens BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_agent_messages_role CHECK (role IN ('user', 'assistant'))
);

CREATE INDEX idx_agent_messages_session_id ON ai_agent_messages(session_id, created_at);

COMMENT ON TABLE ai_agent_messages IS 'Agent 对话消息表';
COMMENT ON COLUMN ai_agent_messages.prompt_tokens IS '输入 token 数量';
COMMENT ON COLUMN ai_agent_messages.completion_tokens IS '输出 token 数量';
COMMENT ON COLUMN ai_agent_messages.total_tokens IS '总 token 数量';

-- 触发器：自动更新会话的消息计数和更新时间
CREATE OR REPLACE FUNCTION update_agent_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE ai_agent_sessions
        SET message_count = message_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.session_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE ai_agent_sessions
        SET message_count = message_count - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.session_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_session_message_count_trigger
    AFTER INSERT OR DELETE ON ai_agent_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_session_message_count();
