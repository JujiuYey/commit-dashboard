import { IconGitFork, IconStar, IconAlertCircle } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { giteaReposApi } from "@/api/gitea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useGiteaStore } from "@/stores/gitea";
import type { GiteaRepository } from "@/types/gitea";

const chartConfig = {
  stars: { label: "Star 数", color: "hsl(45 93% 47%)" },
  forks: { label: "Fork 数", color: "hsl(200 80% 50%)" },
  issues: { label: "待处理 Issue", color: "hsl(0 72% 51%)" },
} satisfies ChartConfig;

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
      {compareData.length > 0 && (
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>仓库多维对比</CardTitle>
            <CardDescription>所选仓库的 Star、Fork 和待处理 Issue 对比</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
              <BarChart data={compareData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="stars" fill="var(--color-stars)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="forks" fill="var(--color-forks)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="issues" fill="var(--color-issues)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* 仓库卡片 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted mb-2" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))
          : repos.map(repo => (
              <Link
                key={repo.id}
                to="/repos/$owner/$repo"
                params={{ owner: repo.owner.login, repo: repo.name }}
                className="block rounded-xl transition-shadow hover:shadow-md hover:ring-1 hover:ring-border"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{repo.full_name}</CardTitle>
                    {repo.description && (
                      <CardDescription className="line-clamp-2">{repo.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {repo.language && (
                        <Badge variant="secondary">{repo.language}</Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <IconStar className="size-3.5" />
                        {repo.stars_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconGitFork className="size-3.5" />
                        {repo.forks_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconAlertCircle className="size-3.5" />
                        {repo.open_issues_count}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      更新于 {new Date(repo.updated_at).toLocaleDateString("zh-CN")}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
        {!loading && repos.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-8">尚未选择仓库</p>
        )}
      </div>
    </div>
  );
}
