import { useCallback, useEffect, useState } from "react";

import { giteaReposApi } from "@/api/gitea";
import type { GiteaRepository } from "@/types/gitea";

export function useUserRepos() {
  const [data, setData] = useState<GiteaRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const repos = await giteaReposApi.getUserRepos({ limit: 100 });
      setData(repos);
    }
    catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch repos"));
    }
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
