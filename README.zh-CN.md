# Commit Dashboard

[English](./README.md)

基于 React 19 + Vite + shadcn/ui 构建的 Gitea 代码提交分析面板。通过个人访问令牌连接 Gitea 实例，可视化提交趋势、成员贡献、仓库对比和 PR 统计。

## 功能特性

- **总览仪表盘** — 统计卡片（总提交数、贡献者、待处理 PR、平均合并时间）+ 提交趋势图 + 最近提交表格
- **提交分析** — 趋势折线图（按天/周/月）+ 活跃热力图（星期 × 小时）+ 完整提交列表分页
- **成员贡献** — 贡献者排行柱状图 + 详细统计表格（提交数、新增行、删除行）
- **仓库对比** — 多维对比柱状图（Star、Fork、Issue）+ 仓库信息卡片
- **PR 统计** — 状态分布图 + 可筛选 PR 列表 + 合并时间统计

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React 19、TypeScript |
| 构建 | Vite 7 |
| 路由 | TanStack Router（文件路由） |
| 状态管理 | Zustand（持久化） |
| UI 组件 | shadcn/ui、Tailwind CSS 4 |
| 图表 | Recharts |
| HTTP | Axios |
| 图标 | @tabler/icons-react |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- 一个 Gitea 实例及其个人访问令牌

### 安装与运行

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

### 使用流程

1. 浏览器打开 `http://localhost:5173`
2. 输入 Gitea 地址（如 `http://192.168.10.209:3000`）和个人访问令牌
3. 点击 **连接**
4. 进入 **设置** 页面选择需要分析的仓库
5. 浏览各分析页面

## 项目结构

```
src/
├── api/gitea/          # Gitea API 接口（认证、提交、PR、仓库）
├── components/
│   ├── ui/             # shadcn/ui 组件
│   └── sag-ui/         # 自定义组件（DataTable、Pagination 等）
├── hooks/              # 数据获取 Hooks（useCommits、useContributors 等）
├── layout/             # 侧边栏布局 + 导航
├── pages/              # 页面组件
│   ├── setup/          # 初始连接页
│   ├── dashboard/      # 总览仪表盘
│   ├── commits/        # 提交分析
│   ├── members/        # 成员贡献
│   ├── repos/          # 仓库对比
│   ├── pulls/          # PR 统计
│   └── settings/       # 连接与仓库设置
├── routes/             # TanStack Router 文件路由
├── stores/             # Zustand 状态管理（gitea、app）
├── types/              # TypeScript 类型定义
└── utils/              # HTTP 客户端、统计工具函数
```

## 工作原理

- 所有 Gitea API 请求通过 Vite 开发服务器插件代理转发（`/gitea-api/*`），避免跨域问题
- Gitea 地址通过 `X-Gitea-Base-Url` 请求头传递，由代理插件动态路由
- 连接信息（地址、令牌、用户、已选仓库）通过 Zustand 持久化到 localStorage

## 开源协议

MIT
