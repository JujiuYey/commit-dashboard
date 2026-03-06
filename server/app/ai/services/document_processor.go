package services

import (
	"context"
	"fmt"
	"strings"

	"sag-reg-server/infrastructure/llm"
	"sag-reg-server/infrastructure/qdrant"
)

type DocumentProcessor struct {
	llmClient    llm.LLMClient
	qdrantClient *qdrant.QdrantClient
}

func NewDocumentProcessor() *DocumentProcessor {
	qdrantClient, err := qdrant.NewQdrantClient()
	if err != nil {
		panic(fmt.Sprintf("创建 Qdrant 客户端失败: %v", err))
	}

	return &DocumentProcessor{
		llmClient:    llm.NewEinoClient(),
		qdrantClient: qdrantClient,
	}
}

// 确保集合存在
func (p *DocumentProcessor) EnsureCollection(ctx context.Context) error {
	return p.qdrantClient.EnsureCollection(ctx)
}

// 处理 Markdown 文档
func (p *DocumentProcessor) ProcessMarkdown(ctx context.Context, content, filename, folderID, documentID string) error {
	// 确保集合存在
	if err := p.EnsureCollection(ctx); err != nil {
		return err
	}

	// 1. 分割文本
	chunks := splitMarkdown(content, 800, 100)

	// 2. 为每个块生成向量并存储
	points := make([]*qdrant.PointStruct, 0, len(chunks))

	for i, chunk := range chunks {
		// 生成向量
		embedding, err := p.llmClient.CreateEmbedding(ctx, chunk)
		if err != nil {
			return fmt.Errorf("生成向量失败: %w", err)
		}

		// 创建向量点
		point := qdrant.CreatePoint(
			qdrant.GenerateID(),
			embedding,
			map[string]interface{}{
				"content":           chunk,
				"filename":          filename,
				"chunk_id":          i,
				"folder_id": folderID,
				"document_id":       documentID,
			},
		)
		points = append(points, point)
	}

	// 3. 存储到 Qdrant
	if err := p.qdrantClient.UpsertPoints(ctx, points); err != nil {
		return fmt.Errorf("存储向量失败: %w", err)
	}

	return nil
}

// 简单的 Markdown 分割
func splitMarkdown(content string, chunkSize, overlap int) []string {
	// 按段落分割
	paragraphs := strings.Split(content, "\n\n")
	var chunks []string
	var currentChunk strings.Builder

	for _, para := range paragraphs {
		if currentChunk.Len()+len(para) > chunkSize && currentChunk.Len() > 0 {
			chunks = append(chunks, currentChunk.String())
			currentChunk.Reset()

			// 添加重叠部分
			if overlap > 0 && len(chunks) > 0 {
				lastChunk := chunks[len(chunks)-1]
				if len(lastChunk) > overlap {
					currentChunk.WriteString(lastChunk[len(lastChunk)-overlap:])
				}
			}
		}
		currentChunk.WriteString(para)
		currentChunk.WriteString("\n\n")
	}

	if currentChunk.Len() > 0 {
		chunks = append(chunks, currentChunk.String())
	}

	return chunks
}
