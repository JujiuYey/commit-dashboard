import { useRepos } from "@/hooks/use-repos";

import { ReposCards } from "./components/repos-cards";
import { ReposCompareChart } from "./components/repos-compare-chart";

export function ReposPage() {
  const { data: repos, loading } = useRepos();

  const compareData = repos.map(r => ({
    name: r.name,
    stars: r.stars_count,
    forks: r.forks_count,
    issues: r.open_issues_count,
  }));

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-bold">仓库对比</h1>

      <ReposCompareChart data={compareData} />

      <ReposCards repos={repos} loading={loading} />
    </div>
  );
}
