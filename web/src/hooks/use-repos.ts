import { useQuery } from "@tanstack/react-query";

import { reposApi } from "@/api";
import type { RepoItem } from "@/api/gitea/repos";

export function useRepos() {
  const query = useQuery({
    queryKey: ["repos"],
    queryFn: () => reposApi.list(),
  });

  return {
    data: query.data ?? [] as RepoItem[],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
