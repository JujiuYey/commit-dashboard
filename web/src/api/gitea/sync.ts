import type { ApiResponse } from "@/types/api";
import { request } from "@/utils/request";

export interface SyncReposResult {
  synced_repos: number;
  duration: string;
}

export interface SyncResult {
  synced_repos: number;
  total_commits: number;
  new_commits: number;
  duration: string;
}

export interface SyncRepoCommitsResult {
  new_commits: number;
}

export const syncApi = {
  syncRepos: () =>
    request.post<ApiResponse<SyncReposResult>>("/sync/repos").then(res => res.data),
  syncCommits: (repo_ids?: number[]) =>
    request.post<ApiResponse<SyncResult>>("/sync/commits", { repo_ids }).then(res => res.data),
  syncRepoCommits: (repo_id: number) =>
    request.post<ApiResponse<SyncRepoCommitsResult>>("/sync/repo-commits", { repo_id }).then(res => res.data),
};
