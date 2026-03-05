import type { GiteaRepository } from "@/types/gitea";
import { request } from "@/utils/request";

export const giteaReposApi = {
  getUserRepos: (params?: { page?: number; limit?: number }) =>
    request.get<GiteaRepository[]>("/user/repos", {
      params: { page: params?.page ?? 1, limit: params?.limit ?? 50, sort: "updated", order: "desc" },
    }),

  getOrgRepos: (org: string, params?: { page?: number; limit?: number }) =>
    request.get<GiteaRepository[]>(`/orgs/${org}/repos`, {
      params: { page: params?.page ?? 1, limit: params?.limit ?? 50 },
    }),

  getRepoInfo: (owner: string, repo: string) =>
    request.get<GiteaRepository>(`/repos/${owner}/${repo}`),
};
