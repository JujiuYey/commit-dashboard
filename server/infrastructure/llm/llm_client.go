package llm

import (
	"context"
)

// LLM 客户端使用的聊天消息
type ChatMessage struct {
	Role    string
	Content string
}

// Token 用量信息
type Usage struct {
	PromptTokens     int64 // 输入 token 数
	CompletionTokens int64 // 输出 token 数
	TotalTokens      int64 // 总 token 数
}

// 生成文本的响应
type GenerateResponse struct {
	Text  string // 生成的文本
	Usage Usage  // Token 用量信息
}

// 统一的 LLM 客户端接口
type LLMClient interface {
	// 生成文本 embedding
	CreateEmbedding(ctx context.Context, text string) ([]float32, error)

	// 生成文本回答
	Generate(ctx context.Context, prompt string) (*GenerateResponse, error)

	// 支持对话历史的聊天
	Chat(ctx context.Context, messages []ChatMessage) (*GenerateResponse, error)
}
