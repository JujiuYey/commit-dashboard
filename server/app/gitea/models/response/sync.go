package response

// SyncReposResult 同步仓库结果
type SyncReposResult struct {
	SyncedRepos int    `json:"synced_repos"`
	Duration    string `json:"duration"`
}

// SyncResult 同步提交结果
type SyncResult struct {
	SyncedRepos  int    `json:"synced_repos"`
	TotalCommits int    `json:"total_commits"`
	NewCommits   int    `json:"new_commits"`
	Duration     string `json:"duration"`
}
