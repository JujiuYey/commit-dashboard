package handlers

import (
	"context"
	"log"

	"github.com/gofiber/fiber/v2"

	ai_payload "sag-reg-server/app/ai/models/payload"
	"sag-reg-server/app/ai/services"
	ai_services "sag-reg-server/app/ai/services"
	"sag-reg-server/common/response"
	"sag-reg-server/infrastructure/database"
)

// 对话处理器
type RagHandler struct {
	dbService *database.DatabaseService
	ragEngine *ai_services.RAGEngine
}

// 创建 RAG 处理器
func NewRagHandler(dbService *database.DatabaseService, ragEngine *services.RAGEngine) *RagHandler {
	return &RagHandler{
		dbService: dbService,
		ragEngine: ragEngine,
	}
}

// 聊天接口
func (h *RagHandler) Chat(c *fiber.Ctx) error {
	log.Println("💬 收到 RAG 聊天请求")

	var req ai_payload.RagChatRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequestCtx(c)
	}

	log.Printf("📝 用户消息: %s, 文件夹ID: %s", req.Message, req.FolderID)

	// 获取当前用户ID（从认证中间件获取）
	userID := c.Locals("user_id")
	var userIDStr *string
	if userID != nil {
		if uid, ok := userID.(string); ok {
			userIDStr = &uid
		}
	}

	// 1. 验证文件夹是否存在
	folder, err := h.dbService.Folders.FindOne(c.Context(), req.FolderID)
	if err != nil {
		log.Printf("❌ 文件夹不存在: %v", err)
		return response.NotFoundCtx(c, "文件夹不存在")
	}
	log.Printf("✅ 找到文件夹: %s", folder.Name)

	// 2. 获取或创建会话
	var sessionID string
	if req.SessionID != nil && *req.SessionID != "" {
		sessionID = *req.SessionID
		// 验证会话是否存在
		session, err := h.dbService.RagSessions.FindOne(c.Context(), sessionID)
		if err != nil {
			log.Printf("❌ 会话不存在: %v", err)
			return response.NotFoundCtx(c, "会话不存在")
		}
		log.Printf("✅ 使用现有会话: %s", session.ID)
	} else {
		// 创建新会话
		session, err := h.dbService.RagSessions.Create(c.Context(), userIDStr, req.FolderID, req.DocumentID)
		if err != nil {
			log.Printf("❌ 创建会话失败: %v", err)
			return response.InternalServerCtx(c, "创建会话失败")
		}
		sessionID = session.ID

		// 使用用户第一句话作为会话标题
		title := req.Message
		if len(title) > 50 {
			title = title[:50]
		}
		if err := h.dbService.RagSessions.UpdateTitle(c.Context(), sessionID, title); err != nil {
			log.Printf("⚠️ 更新会话标题失败: %v", err)
		}

		log.Printf("✅ 会话已创建，ID: %s", sessionID)
	}

	// 3. 保存用户消息
	_, err = h.dbService.RagMessages.Create(c.Context(), sessionID, "user", req.Message, nil, nil, nil, nil, nil)
	if err != nil {
		log.Printf("⚠️  保存用户消息失败: %v", err)
	}

	// 4. 加载历史消息
	history := h.loadHistory(c.Context(), sessionID)

	// 5. 调用 RAG 引擎处理（带知识库和文档过滤）
	result, err := h.ragEngine.ChatWithRAGAndDoc(c.Context(), req.Message, req.FolderID, req.DocumentID, history)
	if err != nil {
		log.Printf("❌ RAG 处理失败: %v", err)
		return response.InternalServerCtx(c, "处理失败")
	}

	log.Printf("✅ RAG 回复: %s", result.Answer)

	// 6. 提取检索到的文档片段
	var apiRetrievedChunks []ai_payload.RetrievedChunk
	var dbRetrievedChunks []map[string]interface{}
	var relevanceScore *float64
	if len(result.Sources) > 0 {
		for _, source := range result.Sources {
			// 保存原始 metadata 到数据库
			dbRetrievedChunks = append(dbRetrievedChunks, source.Metadata)

			// 转换为 API 响应格式
			if metadata := source.Metadata; metadata != nil {
				chunk := ai_payload.RetrievedChunk{}
				if chunkID, ok := metadata["chunk_id"].(float64); ok {
					chunk.ChunkID = int(chunkID)
				}
				if content, ok := metadata["content"].(string); ok {
					chunk.Content = content
				}
				if docID, ok := metadata["document_id"].(string); ok {
					chunk.DocumentID = docID
				}
				if filename, ok := metadata["filename"].(string); ok {
					chunk.Filename = filename
				}
				if fID, ok := metadata["folder_id"].(string); ok {
					chunk.FolderID = fID
				}
				apiRetrievedChunks = append(apiRetrievedChunks, chunk)
			}
		}
	}

	// 转换 usage 信息
	var usage *ai_payload.Usage
	var promptTokens, completionTokens, totalTokens *int64
	if result.Usage != nil {
		usage = &ai_payload.Usage{
			PromptTokens:     result.Usage.PromptTokens,
			CompletionTokens: result.Usage.CompletionTokens,
			TotalTokens:      result.Usage.TotalTokens,
		}
		promptTokens = &result.Usage.PromptTokens
		completionTokens = &result.Usage.CompletionTokens
		totalTokens = &result.Usage.TotalTokens
	}

	// 7. 保存 AI 回复（包含 usage 信息）
	_, err = h.dbService.RagMessages.Create(c.Context(), sessionID, "assistant", result.Answer, dbRetrievedChunks, relevanceScore, promptTokens, completionTokens, totalTokens)
	if err != nil {
		log.Printf("⚠️  保存 AI 回复失败: %v", err)
	}

	return response.SuccessCtx(c, ai_payload.RagChatResponse{
		Response:        result.Answer,
		SessionID:       sessionID,
		RetrievedChunks: apiRetrievedChunks,
		RelevanceScore:  relevanceScore,
		Usage:           usage,
	})
}

// 获取用户的 RAG 会话列表
func (h *RagHandler) ListSessions(c *fiber.Ctx) error {
	log.Println("📋 获取 RAG 会话列表")

	// 获取当前用户ID
	userID := c.Locals("user_id")
	if userID == nil {
		return response.UnauthorizedCtx(c, "未授权")
	}
	userIDStr := userID.(string)

	var req ai_payload.RagSessionListRequest
	if err := c.QueryParser(&req); err != nil {
		return response.BadRequestCtx(c)
	}

	// 设置默认值
	if req.Limit == 0 {
		req.Limit = 20
	}

	// 获取会话列表
	var folderID *string
	if req.FolderID != nil && *req.FolderID != "" {
		folderID = req.FolderID
	}

	sessions, total, err := h.dbService.RagSessions.List(c.Context(), userIDStr, folderID, req.Limit, req.Offset)
	if err != nil {
		log.Printf("❌ 获取会话列表失败: %v", err)
		return response.InternalServerCtx(c, "获取会话列表失败")
	}

	// 转换为响应格式
	items := make([]ai_payload.RagSessionItem, 0, len(sessions))
	for _, session := range sessions {
		// 获取会话的 token 统计
		_, _, totalTokens, err := h.dbService.RagMessages.GetSessionTokenStats(c.Context(), session.ID)
		var totalTokensPtr *int64
		if err == nil {
			totalTokensPtr = &totalTokens
		}

		items = append(items, ai_payload.RagSessionItem{
			ID:              session.ID,
			Title:           session.Title,
			FolderID: session.FolderID,
			DocumentID:      session.DocumentID,
			MessageCount:    session.MessageCount,
			TotalTokens:     totalTokensPtr,
			CreatedAt:       session.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt:       session.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return response.SuccessCtx(c, ai_payload.RagSessionListResponse{
		Sessions: items,
		Total:    total,
	})
}

// 获取会话历史
func (h *RagHandler) History(c *fiber.Ctx) error {
	sessionID := c.Params("session_id")
	if sessionID == "" {
		return response.BadRequestCtx(c, "缺少会话ID")
	}

	log.Printf("📜 获取会话历史: %s", sessionID)

	// 验证会话是否存在
	session, err := h.dbService.RagSessions.FindOne(c.Context(), sessionID)
	if err != nil {
		log.Printf("❌ 会话不存在: %v", err)
		return response.NotFoundCtx(c, "会话不存在")
	}

	// 获取消息列表
	messages, err := h.dbService.RagMessages.ListBySessionID(c.Context(), sessionID, 100, 0)
	if err != nil {
		log.Printf("❌ 获取消息列表失败: %v", err)
		return response.InternalServerCtx(c, "获取消息列表失败")
	}

	// 转换为响应格式
	items := make([]ai_payload.RagMessageItem, 0, len(messages))
	for _, msg := range messages {
		// 转换 retrievedChunks 从 map 到 RetrievedChunk
		var apiRetrievedChunks []ai_payload.RetrievedChunk
		if len(msg.RetrievedChunks) > 0 {
			for _, metadata := range msg.RetrievedChunks {
				chunk := ai_payload.RetrievedChunk{}
				if chunkID, ok := metadata["chunk_id"].(float64); ok {
					chunk.ChunkID = int(chunkID)
				}
				if content, ok := metadata["content"].(string); ok {
					chunk.Content = content
				}
				if docID, ok := metadata["document_id"].(string); ok {
					chunk.DocumentID = docID
				}
				if filename, ok := metadata["filename"].(string); ok {
					chunk.Filename = filename
				}
				if fID, ok := metadata["folder_id"].(string); ok {
					chunk.FolderID = fID
				}
				apiRetrievedChunks = append(apiRetrievedChunks, chunk)
			}
		}

		// 转换 usage 信息
		var usage *ai_payload.Usage
		if msg.PromptTokens != nil && msg.CompletionTokens != nil && msg.TotalTokens != nil {
			usage = &ai_payload.Usage{
				PromptTokens:     *msg.PromptTokens,
				CompletionTokens: *msg.CompletionTokens,
				TotalTokens:      *msg.TotalTokens,
			}
		}

		items = append(items, ai_payload.RagMessageItem{
			ID:              msg.ID,
			Role:            msg.Role,
			Content:         msg.Content,
			RetrievedChunks: apiRetrievedChunks,
			RelevanceScore:  msg.RelevanceScore,
			Usage:           usage,
			CreatedAt:       msg.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	// 获取会话的 token 统计
	_, _, totalTokens, err := h.dbService.RagMessages.GetSessionTokenStats(c.Context(), sessionID)
	var totalTokensPtr *int64
	if err == nil {
		totalTokensPtr = &totalTokens
	}

	return response.SuccessCtx(c, ai_payload.RagHistoryResponse{
		SessionID:   session.ID,
		Messages:    items,
		Total:       len(items),
		TotalTokens: totalTokensPtr,
	})
}

// 删除会话
func (h *RagHandler) DeleteSession(c *fiber.Ctx) error {
	sessionID := c.Params("session_id")
	if sessionID == "" {
		return response.BadRequestCtx(c, "会话ID不能为空")
	}

	log.Printf("🗑️  删除会话: %s", sessionID)

	// 验证会话是否存在
	_, err := h.dbService.RagSessions.FindOne(c.Context(), sessionID)
	if err != nil {
		log.Printf("❌ 会话不存在: %v", err)
		return response.NotFoundCtx(c, "会话不存在")
	}

	// 删除会话
	if err := h.dbService.RagSessions.Delete(c.Context(), sessionID); err != nil {
		log.Printf("❌ 删除会话失败: %v", err)
		return response.InternalServerCtx(c, "删除会话失败")
	}

	return response.SuccessMsgCtx(c, "会话删除成功")
}

// 更新会话标题
func (h *RagHandler) UpdateSessionTitle(c *fiber.Ctx) error {
	sessionID := c.Params("session_id")
	if sessionID == "" {
		return response.BadRequestCtx(c, "缺少会话ID")
	}

	var req struct {
		Title string `json:"title"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequestCtx(c)
	}

	log.Printf("✏️  更新会话标题: %s -> %s", sessionID, req.Title)

	// 更新标题
	if err := h.dbService.RagSessions.UpdateTitle(c.Context(), sessionID, req.Title); err != nil {
		log.Printf("❌ 更新标题失败: %v", err)
		return response.InternalServerCtx(c, "更新标题失败")
	}

	return response.SuccessMsgCtx(c, "标题更新成功")
}

// loadHistory 加载会话历史
func (h *RagHandler) loadHistory(ctx context.Context, sessionID string) []services.ChatMessage {
	// 获取最近的 10 条消息
	messages, err := h.dbService.RagMessages.ListBySessionID(ctx, sessionID, 10, 0)
	if err != nil {
		log.Printf("⚠️  获取历史消息失败: %v", err)
		return nil
	}

	history := make([]ai_services.ChatMessage, 0, len(messages))
	for _, msg := range messages {
		history = append(history, ai_services.ChatMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	return history
}
