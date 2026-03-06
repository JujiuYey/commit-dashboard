package response

// SyncResult 同步结果
type SyncResult struct {
	SyncedRepos  int    `json:"synced_repos"`
	TotalCommits int    `json:"total_commits"`
	NewCommits   int    `json:"new_commits"`
	Duration     string `json:"duration"`
}
