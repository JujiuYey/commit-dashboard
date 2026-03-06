import { useEffect, useState } from "react";

import { giteaReposApi } from "@/api/gitea";
import { useGiteaStore } from "@/stores/gitea";
import type { GiteaRepository } from "@/types/gitea";

import { ReposCards } from "./components/repos-cards";
import { ReposCompareChart } from "./components/repos-compare-chart";

export function ReposPage() {
  const selectedRepos = useGiteaStore(s => s.selectedRepos);
  const [repos, setRepos] = useState<GiteaRepository[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedRepos.length === 0) return;
    setLoading(true);
    Promise.all(
      selectedRepos.map(r => giteaReposApi.getRepoInfo(r.owner, r.repo)),
    )
      .then(setRepos)
      .finally(() => setLoading(false));
  }, [selectedRepos]);

  const compareData = repos.map(r => ({
    name: r.name,
    stars: r.stars_count,
    forks: r.forks_count,
    issues: r.open_issues_count,
  }));

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-bold">仓库对比</h1>

      {/* 对比图表 */}
      <ReposCompareChart data={compareData} />

      {/* 仓库卡片 */}
      <ReposCards repos={repos} loading={loading} />
    </div>
  );
}
