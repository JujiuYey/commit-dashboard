import { useQuery } from "@tanstack/react-query";

import { commitsApi } from "@/api";
import type { CommitItem, CommitListParams } from "@/api/gitea/commits";

export function useMemberCommits(author: string, options: Omit<CommitListParams, "author"> = {}) {
  const query = useQuery({
    queryKey: ["member-commits", author, options],
    queryFn: () => commitsApi.list({ ...options, author }),
    enabled: !!author,
  });

  return {
    data: query.data?.data ?? [] as CommitItem[],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
