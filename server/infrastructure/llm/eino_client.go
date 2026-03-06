package llm

import (
	"context"
	"fmt"

	"sag-reg-server/utils"

	arkembed "github.com/cloudwego/eino-ext/components/embedding/ark"
	arkmodel "github.com/cloudwego/eino-ext/components/model/ark"
	"github.com/cloudwego/eino/components/embedding"
	"github.com/cloudwego/eino/schema"
)

// 基于 Eino 框架的 LLM 客户端
type EinoClient struct {
	chatModel  *arkmodel.ChatModel
	embedder   embedding.Embedder
	modelName  string
	embedModel string
}

// 创建 Eino 客户端
func NewEinoClient() *EinoClient {
	apiKey := utils.GetEnv("ARK_API_KEY", "")
	if apiKey == "" {
		panic("ARK_API_KEY environment variable is not set")
	}

	// ARK_MODEL: Chat 模型的 endpoint ID (格式: ep-xxxxxxx-xxxxx) 或模型名称
	modelName := utils.GetEnv("ARK_MODEL", "doubao-seed-1-6-251015")
	// ARK_EMBEDDING_MODEL: Embedding 模型的 endpoint ID (格式: ep-xxxxxxx-xxxxx)
	// 注意：必须是 endpoint ID，不能是模型名称（如 doubao-embedding-vision-250615）
	embedModel := utils.GetEnv("ARK_EMBEDDING_MODEL", "ep-20251212104245-f5vd4")
	if embedModel == "" {
		panic("ARK_EMBEDDING_MODEL environment variable is not set. Please provide an Ark endpoint ID (format: ep-xxxxxxx-xxxxx)")
	}

	// 创建 ChatModel
	chatModel, err := arkmodel.NewChatModel(context.Background(), &arkmodel.ChatModelConfig{
		Model:  modelName,
		APIKey: apiKey,
	})
	if err != nil {
		panic(fmt.Sprintf("failed to create ChatModel: %v", err))
	}

	// 创建 Embedder
	// 注意：Model 参数必须是 Ark endpoint ID，不是模型名称
	embedder, err := arkembed.NewEmbedder(context.Background(), &arkembed.EmbeddingConfig{
		Model:  embedModel,
		APIKey: apiKey,
	})
	if err != nil {
		panic(fmt.Sprintf("failed to create Embedder: %v. Please ensure ARK_EMBEDDING_MODEL is a valid endpoint ID (format: ep-xxxxxxx-xxxxx)", err))
	}

	return &EinoClient{
		chatModel:  chatModel,
		embedder:   embedder,
		modelName:  modelName,
		embedModel: embedModel,
	}
}

// 生成文本 embedding
func (c *EinoClient) CreateEmbedding(ctx context.Context, text string) ([]float32, error) {
	resp, err := c.embedder.EmbedStrings(ctx, []string{text})
	if err != nil {
		return nil, fmt.Errorf("Eino embedding 生成失败: %w", err)
	}

	if len(resp) == 0 {
		return nil, fmt.Errorf("Eino 返回空的 embedding 数据")
	}

	// 转换为 float32
	embedding := make([]float32, len(resp[0]))
	for i, v := range resp[0] {
		embedding[i] = float32(v)
	}

	return embedding, nil
}

// 生成文本回答
func (c *EinoClient) Generate(ctx context.Context, prompt string) (*GenerateResponse, error) {
	messages := []*schema.Message{
		schema.UserMessage(prompt),
	}

	resp, err := c.chatModel.Generate(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("Eino 生成失败: %w", err)
	}

	return &GenerateResponse{
		Text: resp.Content,
		Usage: Usage{
			PromptTokens:     0,
			CompletionTokens: 0,
			TotalTokens:      0,
		},
	}, nil
}

// 支持对话历史的聊天生成
func (c *EinoClient) Chat(ctx context.Context, messages []ChatMessage) (*GenerateResponse, error) {
	// 转换消息格式
	einoMessages := make([]*schema.Message, 0, len(messages))
	for _, msg := range messages {
		var role schema.RoleType
		switch msg.Role {
		case "user":
			role = schema.User
		case "assistant":
			role = schema.Assistant
		case "system":
			role = schema.System
		default:
			continue
		}
		einoMessages = append(einoMessages, &schema.Message{
			Role:    role,
			Content: msg.Content,
		})
	}

	resp, err := c.chatModel.Generate(ctx, einoMessages)
	if err != nil {
		return nil, fmt.Errorf("Eino 聊天失败: %w", err)
	}

	return &GenerateResponse{
		Text: resp.Content,
		Usage: Usage{
			PromptTokens:     0,
			CompletionTokens: 0,
			TotalTokens:      0,
		},
	}, nil
}

// 确保 EinoClient 实现 LLMClient 接口
var _ LLMClient = (*EinoClient)(nil)

// 批量生成 embedding（效率更高）
func (c *EinoClient) CreateBatchEmbeddings(ctx context.Context, texts []string) ([][]float32, error) {
	resp, err := c.embedder.EmbedStrings(ctx, texts)
	if err != nil {
		return nil, err
	}

	// 转换为 [][]float32
	result := make([][]float32, len(resp))
	for i, embeddings := range resp {
		result[i] = make([]float32, len(embeddings))
		for j, v := range embeddings {
			result[i][j] = float32(v)
		}
	}

	return result, nil
}

// 返回当前配置信息
func (c *EinoClient) GetConfig() (modelName string, embedModel string) {
	return c.modelName, c.embedModel
}

// 返回底层的 ChatModel（用于 agent 框架）
func (c *EinoClient) GetChatModel() *arkmodel.ChatModel {
	return c.chatModel
}
