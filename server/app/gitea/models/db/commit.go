package db

import (
	"time"

	"github.com/uptrace/bun"
)

// Commit 提交记录表
type Commit struct {
	bun.BaseModel `bun:"table:commits,alias:c"`

	ID             int       `bun:"id,pk,autoincrement" json:"id"`
	RepoID         int       `bun:"repo_id,notnull" json:"repo_id"`
	SHA            string    `bun:"sha,notnull,unique" json:"sha"`
	AuthorName     string    `bun:"author_name,notnull" json:"author_name"`
	AuthorEmail    string    `bun:"author_email,notnull" json:"author_email"`
	CommitterName  string    `bun:"committer_name" json:"committer_name"`
	CommitterEmail string    `bun:"committer_email" json:"committer_email"`
	Message        string    `bun:"message,notnull" json:"message"`
	Additions      int       `bun:"additions" json:"additions"`
	Deletions      int       `bun:"deletions" json:"deletions"`
	TotalChanges   int       `bun:"total_changes" json:"total_changes"`
	CommittedAt    time.Time `bun:"committed_at,notnull" json:"committed_at"`
	CreatedAt      time.Time `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`

	// 关联
	Repository *Repository `bun:"rel:belongs-to,join:repo_id=id" json:"repository,omitempty"`
}
