import type { ApiResponse, PageData } from "@/types/api";
import { request } from "@/utils/request";

export interface CommitItem {
  id: number;
  sha: string;
  author_name: string;
  author_email: string;
  message: string;
  additions: number;
  deletions: number;
  total_changes: number;
  repo_name: string;
  committed_at: string;
}

export interface CommitTrendItem {
  date: string;
  commits: number;
}

export interface CommitHeatmapItem {
  day_of_week: number;
  hour: number;
  count: number;
}

export interface CommitStats {
  total_commits: number;
  total_additions: number;
  total_deletions: number;
  trend: CommitTrendItem[];
  heatmap: CommitHeatmapItem[];
}

export interface CommitListParams {
  repo_id?: number;
  author?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export const commitsApi = {
  list: (params?: CommitListParams) =>
    request.get<ApiResponse<PageData<CommitItem>>>("/commits", { params }).then(res => res.data),

  stats: (params?: { repo_id?: number; start_date?: string; end_date?: string }) =>
    request.get<ApiResponse<CommitStats>>("/commits/stats", { params }).then(res => res.data),
};
