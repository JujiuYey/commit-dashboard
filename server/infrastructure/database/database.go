package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
	"github.com/uptrace/bun/extra/bundebug"

	ai_db "sag-reg-server/app/ai/models/db"
	gitea_db "sag-reg-server/app/gitea/models/db"
)

// 数据库服务（只负责连接管理）
type DatabaseService struct {
	db *bun.DB
}

// 创建数据库服务
func NewDatabaseService(dsn string) (*DatabaseService, error) {
	// 创建 PostgreSQL 连接
	sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))

	// 配置连接池
	sqldb.SetMaxOpenConns(25)
	sqldb.SetMaxIdleConns(10)
	sqldb.SetConnMaxLifetime(30 * time.Minute)
	sqldb.SetConnMaxIdleTime(5 * time.Minute)

	// 创建 Bun DB 实例
	db := bun.NewDB(sqldb, pgdialect.New())

	// 注册模型
	db.RegisterModel((*gitea_db.Repository)(nil))
	db.RegisterModel((*gitea_db.Commit)(nil))
	db.RegisterModel((*gitea_db.Contributor)(nil))
	db.RegisterModel((*gitea_db.ContributorRepoStats)(nil))
	db.RegisterModel((*ai_db.AgentSession)(nil))
	db.RegisterModel((*ai_db.AgentMessage)(nil))

	// 添加查询钩子（开发环境下打印 SQL）
	db.AddQueryHook(bundebug.NewQueryHook(
		bundebug.WithVerbose(true),
		bundebug.FromEnv("BUNDEBUG"),
	))

	// 测试连接
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("数据库连接失败: %w", err)
	}

	return &DatabaseService{db: db}, nil
}

// 关闭数据库连接
func (s *DatabaseService) Close() error {
	return s.db.Close()
}

// 获取 Bun DB 实例（供其他服务使用）
func (s *DatabaseService) GetDB() *bun.DB {
	return s.db
}
