import type { ApiResponse } from "@/types/api";
import { request } from "@/utils/request";

export interface RepoItem {
  id: number;
  gitea_id: number;
  owner: string;
  name: string;
  full_name: string;
  description: string;
  default_branch: string;
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
  synced_at: string;
}

export const reposApi = {
  list: () =>
    request.get<ApiResponse<RepoItem[]>>("/repos").then(res => res.data),
};
