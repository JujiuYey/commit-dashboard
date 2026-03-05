import { useCallback, useEffect, useState } from "react";

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
  const [data, setData] = useState<GiteaPullRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (selectedRepos.length === 0) {
      setData([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        selectedRepos.map(r =>
          giteaPullsApi.listPullRequests(r.owner, r.repo, { state, page, limit }),
        ),
      );
      const allPRs = results.flatMap(r => r.data);
      allPRs.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setData(allPRs);
      setTotal(results.reduce((s, r) => s + r.total, 0));
    }
    catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch pull requests"));
    }
    finally {
      setLoading(false);
    }
  }, [selectedRepos, state, page, limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}
