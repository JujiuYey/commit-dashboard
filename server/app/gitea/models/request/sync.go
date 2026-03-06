package request

// SyncRequest 同步请求
type SyncRequest struct {
	RepoIDs []int64 `json:"repo_ids"` // 要同步的 Gitea 仓库 ID 列表，为空则同步全部
}

// SyncRepoCommitsRequest 同步单个仓库提交请求
type SyncRepoCommitsRequest struct {
	RepoID int64 `json:"repo_id"`
}
