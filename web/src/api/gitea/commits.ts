import type { GiteaCommit, PaginatedResponse } from "@/types/gitea";
import { request } from "@/utils/request";

interface ListCommitsParams {
  page?: number;
  limit?: number;
  sha?: string;
  since?: string;
  until?: string;
  stat?: boolean;
  author?: string;
}

export const giteaCommitsApi = {
  listCommits: async (
    owner: string,
    repo: string,
    params?: ListCommitsParams,
  ): Promise<PaginatedResponse<GiteaCommit>> => {
    const res = await request<GiteaCommit[]>(
      `/repos/${owner}/${repo}/commits`,
      {
        method: "GET",
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 50,
          sha: params?.sha,
          since: params?.since,
          until: params?.until,
          stat: params?.stat,
          author: params?.author,
        },
      },
    );
    const total = Number(res.headers["x-total-count"]) || 0;
    return { data: res.data, total };
  },
};
