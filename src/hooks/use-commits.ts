import { useQuery } from "@tanstack/react-query";

import { giteaCommitsApi } from "@/api/gitea";
import { useGiteaStore } from "@/stores/gitea";
import type { GiteaCommit } from "@/types/gitea";

interface UseCommitsOptions {
  page?: number;
  limit?: number;
  since?: string;
  until?: string;
  stat?: boolean;
}

export function useCommits(options: UseCommitsOptions = {}) {
  const { page = 1, limit = 50, since, until, stat } = options;
  const selectedRepos = useGiteaStore(s => s.selectedRepos);

  const query = useQuery({
    queryKey: ["commits", selectedRepos, page, limit, since, until, stat],
    queryFn: async () => {
      const results = await Promise.all(
        selectedRepos.map(r =>
          giteaCommitsApi.listCommits(r.owner, r.repo, { page, limit, since, until, stat }),
        ),
      );
      const allCommits = results.flatMap(r => r.data);
      allCommits.sort((a, b) =>
        new Date(b.commit.committer.date).getTime() - new Date(a.commit.committer.date).getTime(),
      );
      return {
        data: allCommits,
        total: results.reduce((s, r) => s + r.total, 0),
      };
    },
    enabled: selectedRepos.length > 0,
  });

  return {
    data: query.data?.data ?? [] as GiteaCommit[],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
