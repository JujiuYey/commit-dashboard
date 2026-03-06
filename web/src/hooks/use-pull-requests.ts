import { useQuery } from "@tanstack/react-query";

import { giteaPullsApi } from "@/api/gitea";
import { useGiteaStore } from "@/stores/gitea";
import type { GiteaPullRequest } from "@/types/gitea";

interface UsePullRequestsOptions {
  state?: "open" | "closed" | "all";
  page?: number;
  limit?: number;
}

export function usePullRequests(options: UsePullRequestsOptions = {}) {
  const { state = "all", page = 1, limit = 50 } = options;
  const selectedRepos = useGiteaStore(s => s.selectedRepos);

  const query = useQuery({
    queryKey: ["pull-requests", selectedRepos, state, page, limit],
    queryFn: async () => {
      const results = await Promise.all(
        selectedRepos.map(r =>
          giteaPullsApi.listPullRequests(r.owner, r.repo, { state, page, limit }),
        ),
      );
      const allPRs = results.flatMap(r => r.data);
      allPRs.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      return {
        data: allPRs,
        total: results.reduce((s, r) => s + r.total, 0),
      };
    },
    enabled: selectedRepos.length > 0,
  });

  return {
    data: query.data?.data ?? [] as GiteaPullRequest[],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
