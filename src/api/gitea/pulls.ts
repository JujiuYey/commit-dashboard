import type { GiteaPullRequest, PaginatedResponse } from "@/types/gitea";
import { request } from "@/utils/request";

interface ListPullsParams {
  state?: "open" | "closed" | "all";
  sort?: "oldest" | "recentupdate" | "leastupdate" | "mostcomment" | "leastcomment" | "priority";
  page?: number;
  limit?: number;
  labels?: string;
  milestone?: number;
}

export const giteaPullsApi = {
  listPullRequests: async (
    owner: string,
    repo: string,
    params?: ListPullsParams,
  ): Promise<PaginatedResponse<GiteaPullRequest>> => {
    const res = await request<GiteaPullRequest[]>(
      `/repos/${owner}/${repo}/pulls`,
      {
        method: "GET",
        params: {
          state: params?.state ?? "all",
          sort: params?.sort,
          page: params?.page ?? 1,
          limit: params?.limit ?? 50,
          labels: params?.labels,
          milestone: params?.milestone,
        },
      },
    );
    const total = Number(res.headers["x-total-count"]) || 0;
    return { data: res.data, total };
  },
};
