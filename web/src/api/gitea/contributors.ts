import type { ApiResponse, PageData } from "@/types/api";
import { request } from "@/utils/request";

export interface ContributorItem {
  id: number;
  name: string;
  email: string;
  total_commits: number;
  total_additions: number;
  total_deletions: number;
  first_commit_at: string;
  last_commit_at: string;
}

export interface ContributorRepoStats {
  repo_id: number;
  repo_name: string;
  commits_count: number;
  additions: number;
  deletions: number;
  first_commit_at: string;
  last_commit_at: string;
}

export interface ContributorDetail extends ContributorItem {
  repo_stats: ContributorRepoStats[];
}

export const contributorsApi = {
  list: (params?: { page?: number; page_size?: number }) =>
    request.get<ApiResponse<PageData<ContributorItem>>>("/contributors", { params }).then(res => res.data),

  detail: (id: number) =>
    request.get<ApiResponse<ContributorDetail>>(`/contributors/${id}`).then(res => res.data),
};
