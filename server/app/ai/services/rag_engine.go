package services

import (
	"context"
	"fmt"
	"log"
	"strings"

	"sag-reg-server/app/ai/models/payload"
	"sag-reg-server/infrastructure/llm"
	"sag-reg-server/infrastructure/qdrant"
)

type RAGEngine struct {
	llmClient    llm.LLMClient
	qdrantClient *qdrant.QdrantClient
	processor    *DocumentProcessor
}

func NewRAGEngine() *RAGEngine {
	qdrantClient, err := qdrant.NewQdrantClient()
	if err != nil {
		panic(fmt.Sprintf("创建 Qdrant 客户端失败: %v", err))
	}

	return &RAGEngine{
		llmClient:    llm.NewEinoClient(),
		qdrantClient: qdrantClient,
		processor:    NewDocumentProcessor(),
	}
}

// 处理查询
func (e *RAGEngine) Query(ctx context.Context, question string) (*payload.QueryResponse, error) {
	// 1. 将问题向量化
	queryEmbedding, err := e.llmClient.CreateEmbedding(ctx, question)
	if err != nil {
		return nil, fmt.Errorf("问题向量化失败: %w", err)
	}

	// 2. 向量检索
	results, err := e.qdrantClient.SearchByVector(ctx, queryEmbedding, 4, nil)
	if err != nil {
		return nil, fmt.Errorf("向量检索失败: %w", err)
	}

	// 3. 构建上下文
	var contextBuilder strings.Builder
	var sources []payload.Source

	for i, result := range results {
		content, ok := result.Payload["content"].(string)
		if !ok {
			continue
		}

		contextBuilder.WriteString(fmt.Sprintf("[上下文 %d]: %s\n", i+1, content))

		sources = append(sources, payload.Source{
			Content:  content,
			Metadata: result.Payload,
		})
	}

	// 4. 构建提示词
	prompt := fmt.Sprintf(`请根据以下上下文信息回答问题。如果上下文没有相关信息，请说明你不知道。

上下文：
%s

问题：%s

请提供准确、有用的回答：`, contextBuilder.String(), question)

	// 5. 调用 LLM 生成答案
	generateResp, err := e.llmClient.Generate(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("生成答案失败: %w", err)
	}

	return &payload.QueryResponse{
		Answer:  generateResp.Text,
		Sources: sources,
		Usage:   &generateResp.Usage,
	}, nil
}

func truncateText(text string, maxLen int) string {
	if len(text) <= maxLen {
		return text
	}
	return text[:maxLen] + "..."
}

// 聊天消息（用于服务层）
type ChatMessage struct {
	Role    string
	Content string
}

// 支持对话历史的 RAG 聊天
func (e *RAGEngine) ChatWithRAG(ctx context.Context, message string, history []ChatMessage) (*payload.QueryResponse, error) {
	// 1. 将用户消息向量化
	queryEmbedding, err := e.llmClient.CreateEmbedding(ctx, message)
	if err != nil {
		return nil, fmt.Errorf("消息向量化失败: %w", err)
	}

	// 2. 向量检索相关文档
	results, err := e.qdrantClient.SearchByVector(ctx, queryEmbedding, 3, nil)
	if err != nil {
		return nil, fmt.Errorf("向量检索失败: %w", err)
	}

	// 3. 构建知识库上下文
	var contextBuilder strings.Builder
	var sources []payload.Source

	if len(results) > 0 {
		contextBuilder.WriteString("【知识库相关内容】\n")
		for i, result := range results {
			content, ok := result.Payload["content"].(string)
			if !ok {
				continue
			}
			contextBuilder.WriteString(fmt.Sprintf("[文档 %d]: %s\n", i+1, content))

			sources = append(sources, payload.Source{
				Content:  content,
				Metadata: result.Payload,
			})
		}
		contextBuilder.WriteString("\n")
	}

	// 4. 构建对话历史
	var historyBuilder strings.Builder
	if len(history) > 0 {
		historyBuilder.WriteString("【对话历史】\n")
		for _, msg := range history {
			switch msg.Role {
			case "user":
				historyBuilder.WriteString(fmt.Sprintf("用户: %s\n", msg.Content))
			case "assistant":
				historyBuilder.WriteString(fmt.Sprintf("助手: %s\n", msg.Content))
			}
		}
		historyBuilder.WriteString("\n")
	}

	// 5. 构建完整提示词
	prompt := fmt.Sprintf(`你是一个智能助手。请根据以下信息回答用户的问题：

%s%s当前问题：%s

请提供准确、有用的回答。如果知识库中有相关信息，请优先使用；如果没有相关信息，可以基于你的知识回答，但要说明这不是来自知识库的内容。`,
		contextBuilder.String(),
		historyBuilder.String(),
		message)

	// 6. 调用 LLM 生成答案
	generateResp, err := e.llmClient.Generate(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("生成答案失败: %w", err)
	}

	return &payload.QueryResponse{
		Answer:  generateResp.Text,
		Sources: sources,
		Usage:   &generateResp.Usage,
	}, nil
}

// 支持对话历史和知识库过滤的 RAG 聊天
func (e *RAGEngine) ChatWithRAGAndFolder(ctx context.Context, message string, folderID string, history []ChatMessage) (*payload.QueryResponse, error) {
	// 1. 将用户消息向量化
	queryEmbedding, err := e.llmClient.CreateEmbedding(ctx, message)
	if err != nil {
		return nil, fmt.Errorf("消息向量化失败: %w", err)
	}

	// 2. 向量检索相关文档（带知识库过滤）
	filters := map[string]interface{}{
		"must": []map[string]interface{}{
			{
				"key": "folder_id",
				"match": map[string]interface{}{
					"value": folderID,
				},
			},
		},
	}

	results, err := e.qdrantClient.SearchByVector(ctx, queryEmbedding, 3, filters)
	if err != nil {
		return nil, fmt.Errorf("向量检索失败: %w", err)
	}

	// 3. 构建知识库上下文
	var contextBuilder strings.Builder
	var sources []payload.Source

	if len(results) > 0 {
		contextBuilder.WriteString("【知识库相关内容】\n")
		for i, result := range results {
			content, ok := result.Payload["content"].(string)
			if !ok {
				continue
			}
			contextBuilder.WriteString(fmt.Sprintf("[文档 %d]: %s\n", i+1, content))

			sources = append(sources, payload.Source{
				Content:  content,
				Metadata: result.Payload,
			})
		}
		contextBuilder.WriteString("\n")
	}

	// 4. 构建对话历史
	var historyBuilder strings.Builder
	if len(history) > 0 {
		historyBuilder.WriteString("【对话历史】\n")
		for _, msg := range history {
			switch msg.Role {
			case "user":
				historyBuilder.WriteString(fmt.Sprintf("用户: %s\n", msg.Content))
			case "assistant":
				historyBuilder.WriteString(fmt.Sprintf("助手: %s\n", msg.Content))
			}
		}
		historyBuilder.WriteString("\n")
	}

	// 5. 构建完整提示词
	prompt := fmt.Sprintf(`你是一个智能助手。请根据以下信息回答用户的问题：

%s%s当前问题：%s

请提供准确、有用的回答。如果知识库中有相关信息，请优先使用；如果没有相关信息，可以基于你的知识回答，但要说明这不是来自知识库的内容。`,
		contextBuilder.String(),
		historyBuilder.String(),
		message)

	// 6. 调用 LLM 生成答案
	generateResp, err := e.llmClient.Generate(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("生成答案失败: %w", err)
	}

	return &payload.QueryResponse{
		Answer:  generateResp.Text,
		Sources: sources,
		Usage:   &generateResp.Usage,
	}, nil
}

// 支持对话历史和文档过滤的 RAG 聊天
func (e *RAGEngine) ChatWithRAGAndDoc(ctx context.Context, message string, folderID string, documentID *string, history []ChatMessage) (*payload.QueryResponse, error) {
	// 1. 将用户消息向量化
	queryEmbedding, err := e.llmClient.CreateEmbedding(ctx, message)
	if err != nil {
		return nil, fmt.Errorf("消息向量化失败: %w", err)
	}

	// 2. 构建过滤条件
	filter := map[string]interface{}{
		"must": []map[string]interface{}{
			{
				"key": "folder_id",
				"match": map[string]interface{}{
					"value": folderID,
				},
			},
		},
	}

	// 如果指定了 document_id，添加文档过滤
	if documentID != nil && *documentID != "" {
		mustFilters := filter["must"].([]map[string]interface{})
		mustFilters = append(mustFilters, map[string]interface{}{
			"key": "document_id",
			"match": map[string]interface{}{
				"value": *documentID,
			},
		})
		filter["must"] = mustFilters
	}

	// 3. 向量检索相关文档
	results, err := e.qdrantClient.SearchByVector(ctx, queryEmbedding, 3, filter)
	if err != nil {
		return nil, fmt.Errorf("向量检索失败: %w", err)
	}

	log.Printf("✅ RAG 搜索结果: %d 条", len(results))

	// 4. 构建知识库上下文
	var contextBuilder strings.Builder
	var sources []payload.Source

	if len(results) > 0 {
		if documentID != nil && *documentID != "" {
			contextBuilder.WriteString("【文档相关内容】\n")
		} else {
			contextBuilder.WriteString("【知识库相关内容】\n")
		}
		for i, result := range results {
			content, ok := result.Payload["content"].(string)
			if !ok {
				continue
			}
			contextBuilder.WriteString(fmt.Sprintf("[文档 %d]: %s\n", i+1, content))

			sources = append(sources, payload.Source{
				Content:  truncateText(content, 200),
				Metadata: result.Payload,
			})
		}
		contextBuilder.WriteString("\n")
	}

	// 5. 构建对话历史
	var historyBuilder strings.Builder
	if len(history) > 0 {
		historyBuilder.WriteString("【对话历史】\n")
		for _, msg := range history {
			switch msg.Role {
			case "user":
				historyBuilder.WriteString(fmt.Sprintf("用户: %s\n", msg.Content))
			case "assistant":
				historyBuilder.WriteString(fmt.Sprintf("助手: %s\n", msg.Content))
			}
		}
		historyBuilder.WriteString("\n")
	}

	// 6. 构建完整提示词
	var promptPrefix string
	if documentID != nil && *documentID != "" {
		promptPrefix = "你是一个智能助手。请根据以下文档内容回答用户的问题："
	} else {
		promptPrefix = "你是一个智能助手。请根据以下信息回答用户的问题："
	}

	prompt := fmt.Sprintf(`%s

%s%s当前问题：%s

请提供准确、有用的回答。如果知识库中有相关信息，请优先使用；如果没有相关信息，可以基于你的知识回答，但要说明这不是来自知识库的内容。`,
		promptPrefix,
		contextBuilder.String(),
		historyBuilder.String(),
		message)

	// 7. 调用 LLM 生成答案
	generateResp, err := e.llmClient.Generate(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("生成答案失败: %w", err)
	}

	return &payload.QueryResponse{
		Answer:  generateResp.Text,
		Sources: sources,
		Usage:   &generateResp.Usage,
	}, nil
}
