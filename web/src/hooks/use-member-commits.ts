import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { giteaCommitsApi } from "@/api/gitea";
import { useGiteaStore } from "@/stores/gitea";
import type { GiteaCommit } from "@/types/gitea";

interface UseMemberCommitsOptions {
  page?: number;
  limit?: number;
  since?: string;
  until?: string;
  stat?: boolean;
}

export function useMemberCommits(
  login: string,
  options: UseMemberCommitsOptions = {},
) {
  const { page = 1, limit = 200, since, until, stat } = options;
  const selectedRepos = useGiteaStore(s => s.selectedRepos);

  const query = useQuery({
    queryKey: ["member-commits", login, selectedRepos, page, limit, since, until, stat],
    queryFn: async () => {
      const results = await Promise.all(
        selectedRepos.map(async (r) => {
          const res = await giteaCommitsApi.listCommits(r.owner, r.repo, {
            page,
            limit,
            since,
            until,
            stat,
            author: login,
          });
          return { key: `${r.owner}/${r.repo}`, data: res.data, total: res.total };
        }),
      );
      const repoMap = new Map<string, GiteaCommit[]>();
      const allCommits: GiteaCommit[] = [];
      let totalCount = 0;
      for (const r of results) {
        if (r.data.length > 0) {
          repoMap.set(r.key, r.data);
        }
        allCommits.push(...r.data);
        totalCount += r.total;
      }
      allCommits.sort((a, b) =>
        new Date(b.commit.committer.date).getTime() - new Date(a.commit.committer.date).getTime(),
      );
      return { data: allCommits, byRepo: repoMap, total: totalCount };
    },
    enabled: !!login && selectedRepos.length > 0,
  });

  const byRepo = useMemo(
    () => query.data?.byRepo ?? new Map<string, GiteaCommit[]>(),
    [query.data?.byRepo],
  );

  return {
    data: query.data?.data ?? [] as GiteaCommit[],
    byRepo,
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
