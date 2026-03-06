import { useQuery } from "@tanstack/react-query";

import { commitsApi } from "@/api";
import type { CommitItem } from "@/api/gitea/commits";

interface UseRepoCommitsOptions {
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
  author?: string;
}

export function useRepoCommits(repoId: number, options: UseRepoCommitsOptions = {}) {
  const query = useQuery({
    queryKey: ["repo-commits", repoId, options],
    queryFn: () => commitsApi.list({ ...options, repo_id: repoId }),
    enabled: !!repoId,
  });

  return {
    data: query.data?.data ?? [] as CommitItem[],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
