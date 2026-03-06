package request

// ContributorQueryParams 贡献者查询参数
type ContributorQueryParams struct {
	Page     int `query:"page"`
	PageSize int `query:"page_size"`
}
