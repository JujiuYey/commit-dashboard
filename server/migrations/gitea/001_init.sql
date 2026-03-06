-- 仓库表
CREATE TABLE IF NOT EXISTS repositories (
    id SERIAL PRIMARY KEY,
    gitea_id BIGINT UNIQUE NOT NULL,
    owner VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(512) NOT NULL,
    description TEXT,
    default_branch VARCHAR(255) DEFAULT 'main',
    stars_count INT DEFAULT 0,
    forks_count INT DEFAULT 0,
    open_issues_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repositories_gitea_id ON repositories(gitea_id);
CREATE INDEX idx_repositories_full_name ON repositories(full_name);

-- 提交记录表
CREATE TABLE IF NOT EXISTS commits (
    id SERIAL PRIMARY KEY,
    repo_id INT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    sha VARCHAR(40) UNIQUE NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    committer_name VARCHAR(255),
    committer_email VARCHAR(255),
    message TEXT NOT NULL,
    additions INT DEFAULT 0,
    deletions INT DEFAULT 0,
    total_changes INT DEFAULT 0,
    committed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commits_repo_id ON commits(repo_id);
CREATE INDEX idx_commits_sha ON commits(sha);
CREATE INDEX idx_commits_repo_committed ON commits(repo_id, committed_at DESC);
CREATE INDEX idx_commits_author_email ON commits(author_email);
CREATE INDEX idx_commits_committed_at ON commits(committed_at DESC);

-- 贡献者表（从 commits 聚合）
CREATE TABLE IF NOT EXISTS contributors (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    total_commits INT DEFAULT 0,
    total_additions INT DEFAULT 0,
    total_deletions INT DEFAULT 0,
    first_commit_at TIMESTAMP,
    last_commit_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contributors_email ON contributors(email);
CREATE INDEX idx_contributors_total_commits ON contributors(total_commits DESC);

-- 贡献者-仓库关联表（每个贡献者在每个仓库的统计）
CREATE TABLE IF NOT EXISTS contributor_repo_stats (
    id SERIAL PRIMARY KEY,
    contributor_id INT NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
    repo_id INT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    commits_count INT DEFAULT 0,
    additions INT DEFAULT 0,
    deletions INT DEFAULT 0,
    first_commit_at TIMESTAMP,
    last_commit_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contributor_id, repo_id)
);

CREATE INDEX idx_contributor_repo_stats_contributor ON contributor_repo_stats(contributor_id);
CREATE INDEX idx_contributor_repo_stats_repo ON contributor_repo_stats(repo_id);
