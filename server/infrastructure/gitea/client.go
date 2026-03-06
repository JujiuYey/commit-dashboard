package gitea

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// Client Gitea API 客户端
type Client struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

// NewClient 创建 Gitea API 客户端
func NewClient(baseURL, token string) *Client {
	return &Client{
		baseURL: baseURL,
		token:   token,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GiteaRepo Gitea 仓库响应结构
type GiteaRepo struct {
	ID              int64     `json:"id"`
	Owner           GiteaUser `json:"owner"`
	Name            string    `json:"name"`
	FullName        string    `json:"full_name"`
	Description     string    `json:"description"`
	DefaultBranch   string    `json:"default_branch"`
	StarsCount      int       `json:"stars_count"`
	ForksCount      int       `json:"forks_count"`
	OpenIssuesCount int       `json:"open_issues_count"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// GiteaUser Gitea 用户信息
type GiteaUser struct {
	ID        int64  `json:"id"`
	Login     string `json:"login"`
	FullName  string `json:"full_name"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
}

// GiteaCommit Gitea 提交响应结构
type GiteaCommit struct {
	SHA    string          `json:"sha"`
	Commit GiteaCommitInfo `json:"commit"`
	Stats  *GiteaStats     `json:"stats"`
}

// GiteaCommitInfo 提交详细信息
type GiteaCommitInfo struct {
	Message   string          `json:"message"`
	Author    GiteaCommitUser `json:"author"`
	Committer GiteaCommitUser `json:"committer"`
}

// GiteaCommitUser 提交中的用户信息
type GiteaCommitUser struct {
	Name  string    `json:"name"`
	Email string    `json:"email"`
	Date  time.Time `json:"date"`
}

// GiteaStats 提交统计信息
type GiteaStats struct {
	Additions int `json:"additions"`
	Deletions int `json:"deletions"`
	Total     int `json:"total"`
}

// get 发送 GET 请求
func (c *Client) get(path string) ([]byte, error) {
	url := fmt.Sprintf("%s/api/v1%s", c.baseURL, path)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "token "+c.token)
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Gitea API 返回错误: %d, %s", resp.StatusCode, string(body))
	}

	return body, nil
}

// GetRepos 获取用户有权限访问的所有仓库
func (c *Client) GetRepos() ([]GiteaRepo, error) {
	var allRepos []GiteaRepo
	page := 1
	limit := 50

	for {
		path := fmt.Sprintf("/repos/search?page=%d&limit=%d&token=%s", page, limit, c.token)
		body, err := c.get(path)
		if err != nil {
			return nil, fmt.Errorf("获取仓库列表失败: %w", err)
		}

		var result struct {
			Data []GiteaRepo `json:"data"`
			OK   bool        `json:"ok"`
		}
		if err := json.Unmarshal(body, &result); err != nil {
			return nil, fmt.Errorf("解析仓库列表失败: %w", err)
		}

		allRepos = append(allRepos, result.Data...)

		// 如果返回的数量少于 limit，说明已经是最后一页
		if len(result.Data) < limit {
			break
		}
		page++
	}

	return allRepos, nil
}

// GetRepoCommits 获取仓库的提交记录
// sha 参数指定分支，stopAtSHA 为上次同步的最新提交 SHA（增量同步，为空则全量）
func (c *Client) GetRepoCommits(owner, repo, sha, stopAtSHA string) ([]GiteaCommit, error) {
	var allCommits []GiteaCommit
	page := 1
	limit := 50

	for {
		path := fmt.Sprintf("/repos/%s/%s/commits?page=%d&limit=%d&sha=%s&stat=true",
			owner, repo, page, limit, sha)
		log.Printf("[GetRepoCommits] 请求: %s", path)
		body, err := c.get(path)
		if err != nil {
			log.Printf("[GetRepoCommits] 请求失败: %v", err)
			return nil, fmt.Errorf("获取提交记录失败: %w", err)
		}
		log.Printf("[GetRepoCommits] 返回 %d 字节", len(body))

		var commits []GiteaCommit
		if err := json.Unmarshal(body, &commits); err != nil {
			return nil, fmt.Errorf("解析提交记录失败: %w", err)
		}

		// 增量同步：遇到已同步的 SHA 则停止
		done := false
		if stopAtSHA != "" {
			for _, commit := range commits {
				if commit.SHA == stopAtSHA {
					done = true
					break
				}
				allCommits = append(allCommits, commit)
			}
		} else {
			allCommits = append(allCommits, commits...)
		}

		if done || len(commits) < limit {
			break
		}
		page++
	}

	log.Printf("[GetRepoCommits] 共获取 %d 条新提交", len(allCommits))
	return allCommits, nil
}

// GetSingleCommit 获取单个提交的详细信息（包含 stats）
func (c *Client) GetSingleCommit(owner, repo, sha string) (*GiteaCommit, error) {
	path := fmt.Sprintf("/repos/%s/%s/git/commits/%s", owner, repo, sha)
	body, err := c.get(path)
	if err != nil {
		return nil, fmt.Errorf("获取提交详情失败: %w", err)
	}

	var commit GiteaCommit
	if err := json.Unmarshal(body, &commit); err != nil {
		return nil, fmt.Errorf("解析提交详情失败: %w", err)
	}

	return &commit, nil
}

// VerifyToken 验证 Token 是否有效
func (c *Client) VerifyToken() (*GiteaUser, error) {
	body, err := c.get("/user")
	if err != nil {
		return nil, fmt.Errorf("验证 Token 失败: %w", err)
	}

	var user GiteaUser
	if err := json.Unmarshal(body, &user); err != nil {
		return nil, fmt.Errorf("解析用户信息失败: %w", err)
	}

	return &user, nil
}
