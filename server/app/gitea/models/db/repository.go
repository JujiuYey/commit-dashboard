package db

import (
	"time"

	"github.com/uptrace/bun"
)

// Repository 仓库表
type Repository struct {
	bun.BaseModel `bun:"table:repositories,alias:r"`

	ID              int       `bun:"id,pk,autoincrement" json:"id"`
	GiteaID         int64     `bun:"gitea_id,notnull,unique" json:"gitea_id"`
	Owner           string    `bun:"owner,notnull" json:"owner"`
	Name            string    `bun:"name,notnull" json:"name"`
	FullName        string    `bun:"full_name,notnull" json:"full_name"`
	Description     string    `bun:"description" json:"description"`
	DefaultBranch   string    `bun:"default_branch" json:"default_branch"`
	StarsCount      int       `bun:"stars_count" json:"stars_count"`
	ForksCount      int       `bun:"forks_count" json:"forks_count"`
	OpenIssuesCount int       `bun:"open_issues_count" json:"open_issues_count"`
	CreatedAt       time.Time `bun:"created_at,notnull" json:"created_at"`
	UpdatedAt       time.Time `bun:"updated_at,notnull" json:"updated_at"`
	SyncedAt        time.Time `bun:"synced_at,nullzero,default:current_timestamp" json:"synced_at"`
}
