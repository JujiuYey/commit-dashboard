-- ============================================
-- Gitea 数据同步表结构
-- 用于存储从 Gitea 同步的仓库、提交和贡献者数据
-- ============================================

-- 仓库表
-- 存储从 Gitea 同步的仓库基本信息
CREATE TABLE IF NOT EXISTS repositories (
    id SERIAL PRIMARY KEY,
    gitea_id BIGINT UNIQUE NOT NULL,           -- Gitea 仓库 ID
    owner VARCHAR(255) NOT NULL,                -- 仓库所有者
    name VARCHAR(255) NOT NULL,                 -- 仓库名称
    full_name VARCHAR(512) NOT NULL,            -- 完整名称 (owner/name)
    description TEXT,                           -- 仓库描述
    default_branch VARCHAR(255) DEFAULT 'main', -- 默认分支
    stars_count INT DEFAULT 0,                  -- Star 数量
    forks_count INT DEFAULT 0,                  -- Fork 数量
    open_issues_count INT DEFAULT 0,            -- 未关闭 Issue 数量
    created_at TIMESTAMP NOT NULL,              -- Gitea 创建时间
    updated_at TIMESTAMP NOT NULL,              -- Gitea 更新时间
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 最后同步时间
);

COMMENT ON TABLE repositories IS '仓库表';
COMMENT ON COLUMN repositories.gitea_id IS 'Gitea 仓库 ID';
COMMENT ON COLUMN repositories.owner IS '仓库所有者';
COMMENT ON COLUMN repositories.name IS '仓库名称';
COMMENT ON COLUMN repositories.full_name IS '完整名称 (owner/name)';
COMMENT ON COLUMN repositories.description IS '仓库描述';
COMMENT ON COLUMN repositories.default_branch IS '默认分支';
COMMENT ON COLUMN repositories.stars_count IS 'Star 数量';
COMMENT ON COLUMN repositories.forks_count IS 'Fork 数量';
COMMENT ON COLUMN repositories.open_issues_count IS '未关闭 Issue 数量';
COMMENT ON COLUMN repositories.created_at IS 'Gitea 创建时间';
COMMENT ON COLUMN repositories.updated_at IS 'Gitea 更新时间';
COMMENT ON COLUMN repositories.synced_at IS '最后同步时间';

-- 仓库表索引
CREATE INDEX idx_repositories_gitea_id ON repositories(gitea_id);
CREATE INDEX idx_repositories_full_name ON repositories(full_name);

-- 提交记录表
-- 存储所有仓库的提交历史记录
CREATE TABLE IF NOT EXISTS commits (
    id SERIAL PRIMARY KEY,
    repo_id INT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE, -- 关联仓库
    sha VARCHAR(40) UNIQUE NOT NULL,            -- Git commit SHA
    author_name VARCHAR(255) NOT NULL,          -- 作者名称
    author_email VARCHAR(255) NOT NULL,         -- 作者邮箱
    committer_name VARCHAR(255),                -- 提交者名称
    committer_email VARCHAR(255),               -- 提交者邮箱
    message TEXT NOT NULL,                      -- 提交信息
    additions INT DEFAULT 0,                    -- 新增行数
    deletions INT DEFAULT 0,                    -- 删除行数
    total_changes INT DEFAULT 0,                -- 总变更行数
    committed_at TIMESTAMP NOT NULL,            -- 提交时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 记录创建时间
);

COMMENT ON TABLE commits IS '提交记录表';
COMMENT ON COLUMN commits.repo_id IS '关联仓库 ID';
COMMENT ON COLUMN commits.sha IS 'Git commit SHA';
COMMENT ON COLUMN commits.author_name IS '作者名称';
COMMENT ON COLUMN commits.author_email IS '作者邮箱';
COMMENT ON COLUMN commits.committer_name IS '提交者名称';
COMMENT ON COLUMN commits.committer_email IS '提交者邮箱';
COMMENT ON COLUMN commits.message IS '提交信息';
COMMENT ON COLUMN commits.additions IS '新增行数';
COMMENT ON COLUMN commits.deletions IS '删除行数';
COMMENT ON COLUMN commits.total_changes IS '总变更行数';
COMMENT ON COLUMN commits.committed_at IS '提交时间';

-- 提交记录表索引
CREATE INDEX idx_commits_repo_id ON commits(repo_id);
CREATE INDEX idx_commits_sha ON commits(sha);
CREATE INDEX idx_commits_repo_committed ON commits(repo_id, committed_at DESC);
CREATE INDEX idx_commits_author_email ON commits(author_email);
CREATE INDEX idx_commits_committed_at ON commits(committed_at DESC);

-- 贡献者表
-- 从 commits 表聚合的贡献者统计数据
CREATE TABLE IF NOT EXISTS contributors (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,         -- 贡献者邮箱（唯一标识）
    name VARCHAR(255) NOT NULL,                 -- 贡献者名称
    total_commits INT DEFAULT 0,                -- 总提交数
    total_additions INT DEFAULT 0,              -- 总新增行数
    total_deletions INT DEFAULT 0,              -- 总删除行数
    first_commit_at TIMESTAMP,                  -- 首次提交时间
    last_commit_at TIMESTAMP,                   -- 最后提交时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE contributors IS '贡献者表';
COMMENT ON COLUMN contributors.email IS '贡献者邮箱（唯一标识）';
COMMENT ON COLUMN contributors.name IS '贡献者名称';
COMMENT ON COLUMN contributors.total_commits IS '总提交数';
COMMENT ON COLUMN contributors.total_additions IS '总新增行数';
COMMENT ON COLUMN contributors.total_deletions IS '总删除行数';
COMMENT ON COLUMN contributors.first_commit_at IS '首次提交时间';
COMMENT ON COLUMN contributors.last_commit_at IS '最后提交时间';

-- 贡献者表索引
CREATE INDEX idx_contributors_email ON contributors(email);
CREATE INDEX idx_contributors_total_commits ON contributors(total_commits DESC);

-- 贡献者-仓库关联表
-- 记录每个贡献者在每个仓库的统计数据
CREATE TABLE IF NOT EXISTS contributor_repo_stats (
    id SERIAL PRIMARY KEY,
    contributor_id INT NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
    repo_id INT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    commits_count INT DEFAULT 0,                -- 该仓库的提交数
    additions INT DEFAULT 0,                    -- 该仓库的新增行数
    deletions INT DEFAULT 0,                    -- 该仓库的删除行数
    first_commit_at TIMESTAMP,                  -- 该仓库首次提交时间
    last_commit_at TIMESTAMP,                   -- 该仓库最后提交时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contributor_id, repo_id)             -- 每个贡献者在每个仓库只有一条记录
);

COMMENT ON TABLE contributor_repo_stats IS '贡献者-仓库关联表';
COMMENT ON COLUMN contributor_repo_stats.contributor_id IS '贡献者 ID';
COMMENT ON COLUMN contributor_repo_stats.repo_id IS '仓库 ID';
COMMENT ON COLUMN contributor_repo_stats.commits_count IS '该仓库的提交数';
COMMENT ON COLUMN contributor_repo_stats.additions IS '该仓库的新增行数';
COMMENT ON COLUMN contributor_repo_stats.deletions IS '该仓库的删除行数';
COMMENT ON COLUMN contributor_repo_stats.first_commit_at IS '该仓库首次提交时间';
COMMENT ON COLUMN contributor_repo_stats.last_commit_at IS '该仓库最后提交时间';

-- 贡献者-仓库关联表索引
CREATE INDEX idx_contributor_repo_stats_contributor ON contributor_repo_stats(contributor_id);
CREATE INDEX idx_contributor_repo_stats_repo ON contributor_repo_stats(repo_id);
