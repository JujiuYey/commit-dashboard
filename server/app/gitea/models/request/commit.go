package request

// CommitQueryParams 提交查询参数
type CommitQueryParams struct {
	RepoID    int    `query:"repo_id"`
	Author    string `query:"author"`
	StartDate string `query:"start_date"`
	EndDate   string `query:"end_date"`
	Page      int    `query:"page"`
	PageSize  int    `query:"page_size"`
}
