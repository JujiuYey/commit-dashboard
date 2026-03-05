import { useQuery } from "@tanstack/react-query";

import { giteaCommitsApi } from "@/api/gitea";
import type { GiteaCommit } from "@/types/gitea";

interface UseRepoCommitsOptions {
  page?: number;
  limit?: number;
  since?: string;
  until?: string;
  stat?: boolean;
}

export function useRepoCommits(
  owner: string,
  repo: string,
  options: UseRepoCommitsOptions = {},
) {
  const { page = 1, limit = 50, since, until, stat } = options;

  const query = useQuery({
    queryKey: ["repo-commits", owner, repo, page, limit, since, until, stat],
    queryFn: () => giteaCommitsApi.listCommits(owner, repo, { page, limit, since, until, stat }),
    enabled: !!owner && !!repo,
  });

  return {
    data: query.data?.data ?? [] as GiteaCommit[],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
