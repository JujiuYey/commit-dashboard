package response

// ContributorItem 贡献者列表项
type ContributorItem struct {
	ID             int    `json:"id"`
	Name           string `json:"name"`
	Email          string `json:"email"`
	TotalCommits   int    `json:"total_commits"`
	TotalAdditions int    `json:"total_additions"`
	TotalDeletions int    `json:"total_deletions"`
	FirstCommitAt  string `json:"first_commit_at"`
	LastCommitAt   string `json:"last_commit_at"`
}

// ContributorDetailResponse 贡献者详情响应
type ContributorDetailResponse struct {
	ContributorItem
	RepoStats []ContributorRepoStatsItem `json:"repo_stats"`
}

// ContributorRepoStatsItem 贡献者在某个仓库的统计
type ContributorRepoStatsItem struct {
	RepoID        int    `json:"repo_id"`
	RepoName      string `json:"repo_name"`
	CommitsCount  int    `json:"commits_count"`
	Additions     int    `json:"additions"`
	Deletions     int    `json:"deletions"`
	FirstCommitAt string `json:"first_commit_at"`
	LastCommitAt  string `json:"last_commit_at"`
}
