import { useCallback, useEffect, useState } from "react";

import { giteaCommitsApi } from "@/api/gitea";
import { useGiteaStore } from "@/stores/gitea";
import type { GiteaContributor } from "@/types/gitea";

export function useContributors() {
  const selectedRepos = useGiteaStore(s => s.selectedRepos);
  const [data, setData] = useState<GiteaContributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (selectedRepos.length === 0) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
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
      const merged = Array.from(map.values()).sort((a, b) => b.contributions - a.contributions);
      setData(merged);
    }
    catch (e) {
      setError(e instanceof Error ? e : new Error("获取贡献者数据失败"));
    }
    finally {
      setLoading(false);
    }
  }, [selectedRepos]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
