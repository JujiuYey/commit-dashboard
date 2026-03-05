import { useQuery } from "@tanstack/react-query";

import { giteaReposApi } from "@/api/gitea";
import type { GiteaRepository } from "@/types/gitea";

export function useUserRepos() {
  const query = useQuery({
    queryKey: ["user-repos"],
    queryFn: () => giteaReposApi.getUserRepos({ limit: 100 }),
  });

  return {
    data: query.data ?? [] as GiteaRepository[],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
