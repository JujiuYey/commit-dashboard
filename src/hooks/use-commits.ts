import { useCallback, useEffect, useState } from "react";

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
  const [data, setData] = useState<GiteaCommit[]>([]);
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
          giteaCommitsApi.listCommits(r.owner, r.repo, { page, limit, since, until, stat }),
        ),
      );
      const allCommits = results.flatMap(r => r.data);
      allCommits.sort((a, b) =>
        new Date(b.commit.committer.date).getTime() - new Date(a.commit.committer.date).getTime(),
      );
      setData(allCommits);
      setTotal(results.reduce((s, r) => s + r.total, 0));
    }
    catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch commits"));
    }
    finally {
      setLoading(false);
    }
  }, [selectedRepos, page, limit, since, until, stat]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}
