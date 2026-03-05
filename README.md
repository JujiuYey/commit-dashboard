# Commit Dashboard

[中文文档](./README.zh-CN.md)

A Gitea commit analysis dashboard built with React 19 + Vite + shadcn/ui. Connect to your Gitea instance via Personal Access Token to visualize commit trends, member contributions, repository comparisons, and pull request statistics.

## Features

- **Overview Dashboard** — Summary cards (total commits, contributors, open PRs, avg merge time) + commit trend chart + recent commits table
- **Commit Analysis** — Trend line chart (daily/weekly/monthly) + activity heatmap (day × hour) + full commit list with pagination
- **Member Contributions** — Contributor ranking bar chart + detailed table with additions/deletions per author
- **Repository Comparison** — Multi-metric bar chart (stars, forks, issues) + repository info cards
- **Pull Request Statistics** — Status distribution chart + filterable PR list + merge time stats

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript |
| Build | Vite 7 |
| Routing | TanStack Router (file-based) |
| State | Zustand (persisted) |
| UI | shadcn/ui, Tailwind CSS 4 |
| Charts | Recharts |
| HTTP | Axios |
| Icons | @tabler/icons-react |

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- A Gitea instance with a Personal Access Token

### Install & Run

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

### Usage

1. Open `http://localhost:5173` in your browser
2. Enter your Gitea URL (e.g. `http://192.168.10.209:3000`) and Personal Access Token
3. Click **Connect**
4. Go to **Settings** to select repositories for analysis
5. Explore the dashboard pages

## Project Structure

```
src/
├── api/gitea/          # Gitea API clients (auth, commits, pulls, repos)
├── components/
│   ├── ui/             # shadcn/ui components
│   └── sag-ui/         # Custom components (DataTable, Pagination, etc.)
├── hooks/              # Data fetching hooks (useCommits, useContributors, etc.)
├── layout/             # Sidebar layout + navigation
├── pages/              # Page components
│   ├── setup/          # Initial connection page
│   ├── dashboard/      # Overview dashboard
│   ├── commits/        # Commit analysis
│   ├── members/        # Member contributions
│   ├── repos/          # Repository comparison
│   ├── pulls/          # PR statistics
│   └── settings/       # Connection & repo settings
├── routes/             # TanStack Router file-based routes
├── stores/             # Zustand stores (gitea, app)
├── types/              # TypeScript type definitions
└── utils/              # HTTP client, stats helpers
```

## How It Works

- All Gitea API requests are proxied through a Vite dev server plugin (`/gitea-api/*`) to avoid CORS issues
- The Gitea base URL is passed via `X-Gitea-Base-Url` header and dynamically routed by the proxy
- Connection info (URL, token, user, selected repos) is persisted in localStorage via Zustand

## License

MIT
