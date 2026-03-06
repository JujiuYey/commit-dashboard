import { useQuery } from "@tanstack/react-query";

import { contributorsApi } from "@/api";
import type { ContributorItem } from "@/api/gitea/contributors";

export function useContributors(params?: { page?: number; page_size?: number }) {
  const query = useQuery({
    queryKey: ["contributors", params],
    queryFn: () => contributorsApi.list(params),
  });

  return {
    data: query.data?.data ?? [] as ContributorItem[],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
