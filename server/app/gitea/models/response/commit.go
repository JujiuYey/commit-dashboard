package response

// CommitItem 提交列表项
type CommitItem struct {
	ID           int    `json:"id"`
	SHA          string `json:"sha"`
	AuthorName   string `json:"author_name"`
	AuthorEmail  string `json:"author_email"`
	Message      string `json:"message"`
	Additions    int    `json:"additions"`
	Deletions    int    `json:"deletions"`
	TotalChanges int    `json:"total_changes"`
	RepoName     string `json:"repo_name"`
	CommittedAt  string `json:"committed_at"`
}

// CommitTrendItem 提交趋势数据项
type CommitTrendItem struct {
	Date    string `json:"date"`
	Commits int    `json:"commits"`
}

// CommitHeatmapItem 活跃热力图数据项
type CommitHeatmapItem struct {
	DayOfWeek int `json:"day_of_week"`
	Hour      int `json:"hour"`
	Count     int `json:"count"`
}

// CommitStatsResponse 提交统计响应
type CommitStatsResponse struct {
	TotalCommits   int                `json:"total_commits"`
	TotalAdditions int                `json:"total_additions"`
	TotalDeletions int                `json:"total_deletions"`
	Trend          []CommitTrendItem  `json:"trend"`
	Heatmap        []CommitHeatmapItem `json:"heatmap"`
}
