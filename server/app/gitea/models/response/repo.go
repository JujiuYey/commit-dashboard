package response

// RepoItem 仓库列表项
type RepoItem struct {
	ID              int    `json:"id"`
	GiteaID         int64  `json:"gitea_id"`
	Owner           string `json:"owner"`
	Name            string `json:"name"`
	FullName        string `json:"full_name"`
	Description     string `json:"description"`
	DefaultBranch   string `json:"default_branch"`
	StarsCount      int    `json:"stars_count"`
	ForksCount      int    `json:"forks_count"`
	OpenIssuesCount int    `json:"open_issues_count"`
	SyncedAt        string `json:"synced_at"`
}
