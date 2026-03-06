package db

import (
	"time"

	"github.com/uptrace/bun"
)

// Contributor 贡献者表
type Contributor struct {
	bun.BaseModel `bun:"table:contributors,alias:ct"`

	ID             int       `bun:"id,pk,autoincrement" json:"id"`
	Email          string    `bun:"email,notnull,unique" json:"email"`
	Name           string    `bun:"name,notnull" json:"name"`
	TotalCommits   int       `bun:"total_commits" json:"total_commits"`
	TotalAdditions int       `bun:"total_additions" json:"total_additions"`
	TotalDeletions int       `bun:"total_deletions" json:"total_deletions"`
	FirstCommitAt  time.Time `bun:"first_commit_at" json:"first_commit_at"`
	LastCommitAt   time.Time `bun:"last_commit_at" json:"last_commit_at"`
	CreatedAt      time.Time `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt      time.Time `bun:"updated_at,nullzero,default:current_timestamp" json:"updated_at"`
}

// ContributorRepoStats 贡献者-仓库关联统计表
type ContributorRepoStats struct {
	bun.BaseModel `bun:"table:contributor_repo_stats,alias:crs"`

	ID             int       `bun:"id,pk,autoincrement" json:"id"`
	ContributorID  int       `bun:"contributor_id,notnull" json:"contributor_id"`
	RepoID         int       `bun:"repo_id,notnull" json:"repo_id"`
	CommitsCount   int       `bun:"commits_count" json:"commits_count"`
	Additions      int       `bun:"additions" json:"additions"`
	Deletions      int       `bun:"deletions" json:"deletions"`
	FirstCommitAt  time.Time `bun:"first_commit_at" json:"first_commit_at"`
	LastCommitAt   time.Time `bun:"last_commit_at" json:"last_commit_at"`
	CreatedAt      time.Time `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt      time.Time `bun:"updated_at,nullzero,default:current_timestamp" json:"updated_at"`

	// 关联
	Contributor *Contributor `bun:"rel:belongs-to,join:contributor_id=id" json:"contributor,omitempty"`
	Repository  *Repository  `bun:"rel:belongs-to,join:repo_id=id" json:"repository,omitempty"`
}
