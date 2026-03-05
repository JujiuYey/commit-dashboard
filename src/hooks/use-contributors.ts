import { useQuery } from "@tanstack/react-query";

import { giteaCommitsApi } from "@/api/gitea";
import { useGiteaStore } from "@/stores/gitea";
import type { GiteaContributor } from "@/types/gitea";

export function useContributors() {
  const selectedRepos = useGiteaStore(s => s.selectedRepos);

  const query = useQuery({
    queryKey: ["contributors", selectedRepos],
    queryFn: async () => {
      const results = await Promise.all(
        selectedRepos.map(r =>
          giteaCommitsApi.listCommits(r.owner, r.repo, { limit: 50 }),
        ),
      );
      const map = new Map<string, GiteaContributor>();
      for (const result of results) {
        for (const commit of result.data) {
          const author = commit.author;
          const name = commit.commit.author.name;
          const email = commit.commit.author.email;
          const key = email;
          const existing = map.get(key);
          if (existing) {
            existing.contributions += 1;
          }
          else {
            map.set(key, {
              id: author?.id ?? 0,
              login: author?.login ?? name,
              full_name: author?.full_name ?? name,
              email,
              avatar_url: author?.avatar_url ?? "",
              contributions: 1,
            });
          }
        }
      }
      return Array.from(map.values()).sort((a, b) => b.contributions - a.contributions);
    },
    enabled: selectedRepos.length > 0,
  });

  return {
    data: query.data ?? [] as GiteaContributor[],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
