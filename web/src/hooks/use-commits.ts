import { useQuery } from "@tanstack/react-query";

import { commitsApi } from "@/api";
import type { CommitItem, CommitListParams } from "@/api/gitea/commits";

export function useCommits(params?: CommitListParams) {
  const query = useQuery({
    queryKey: ["commits", params],
    queryFn: () => commitsApi.list(params),
  });

  return {
    data: query.data?.data ?? [] as CommitItem[],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    pageSize: query.data?.page_size ?? 10,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
