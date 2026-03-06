// Pull requests 功能暂未接入后端，预留占位
export function usePullRequests(_options: { state?: "open" | "closed" | "all"; page?: number; page_size?: number } = {}) {
  return {
    data: [],
    total: 0,
    loading: false,
    error: null,
    refetch: () => {},
  };
}
