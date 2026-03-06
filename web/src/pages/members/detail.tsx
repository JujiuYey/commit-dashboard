import { Link, useParams } from "@tanstack/react-router";
import { IconArrowLeft } from "@tabler/icons-react";
import * as React from "react";

import { useMemberCommits } from "@/hooks/use-member-commits";
import type { GiteaCommit } from "@/types/gitea";
import {
  type Granularity,
  getCommitHeatmapData,
  getCommitSizeDistribution,
  getCommitTypeDistribution,
  groupCodeChangesByDate,
  groupCommitsByDate,
} from "@/utils/stats";

import { PeriodCard } from "./detail/components/period-card";
import { CommitTrendChart } from "./detail/components/commit-trend-chart";
import { CommitHeatmap } from "./detail/components/commit-heatmap";
import { CodeChangesChart } from "./detail/components/code-changes-chart";
import { RepoDistribution } from "./detail/components/repo-distribution";
import { CommitTypeDistribution } from "./detail/components/commit-type-distribution";
import { CommitSizeDistribution } from "./detail/components/commit-size-distribution";
import { CommitsTable } from "./detail/components/commits-table";

function filterCommitsByRange(commits: GiteaCommit[], sinceMs: number): GiteaCommit[] {
  return commits.filter(c => new Date(c.commit.committer.date).getTime() >= sinceMs);
}

function getRepoStatsFromMap(byRepo: Map<string, GiteaCommit[]>, sinceMs: number) {
  const result: { repo: string; count: number }[] = [];
  for (const [repo, commits] of byRepo) {
    const filtered = filterCommitsByRange(commits, sinceMs);
    if (filtered.length > 0) {
      result.push({ repo, count: filtered.length });
    }
  }
  return result.sort((a, b) => b.count - a.count);
}

export function MemberDetailPage() {
  const { login } = useParams({ from: "/_layout/members/$login" });
  const [granularity, setGranularity] = React.useState<Granularity>("day");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: commits, byRepo, loading } = useMemberCommits(login, {
    since,
    stat: true,
  });

  const paginatedCommits = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return commits.slice(start, start + pageSize);
  }, [commits, page, pageSize]);

  const trendData = groupCommitsByDate(commits, granularity);
  const heatmapData = getCommitHeatmapData(commits);
  const codeChangesData = groupCodeChangesByDate(commits, granularity);
  const sizeDistribution = getCommitSizeDistribution(commits);
  const typeDistribution = getCommitTypeDistribution(commits);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  const todayStats = getRepoStatsFromMap(byRepo, todayStart.getTime());
  const weekStats = getRepoStatsFromMap(byRepo, weekStart.getTime());
  const monthStats = getRepoStatsFromMap(byRepo, monthStart.getTime());

  const repoDistribution = React.useMemo(() => {
    const result: { repo: string; count: number }[] = [];
    for (const [repo, repoCommits] of byRepo) {
      result.push({ repo, count: repoCommits.length });
    }
    return result.sort((a, b) => b.count - a.count);
  }, [byRepo]);

  const authorInfo = commits[0];

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/members" className="text-muted-foreground hover:text-foreground transition-colors">
          <IconArrowLeft className="size-5" />
        </Link>
        {authorInfo?.author ? (
          <div className="flex items-center gap-3">
            <img
              src={authorInfo.author.avatar_url}
              alt={login}
              className="size-8 rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold">{authorInfo.author.full_name || login}</h1>
              <p className="text-sm text-muted-foreground">@{login}</p>
            </div>
          </div>
        ) : (
          <h1 className="text-2xl font-bold">@{login}</h1>
        )}
      </div>

      {/* ① 时段活跃卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <PeriodCard title="今日" stats={todayStats} />
        <PeriodCard title="本周" stats={weekStats} />
        <PeriodCard title="本月" stats={monthStats} />
      </div>

      {/* ② 提交趋势折线图 */}
      <CommitTrendChart
        data={trendData}
        granularity={granularity}
        onGranularityChange={setGranularity}
      />

      {/* ③ 活跃热力图 */}
      <CommitHeatmap data={heatmapData} />

      {/* ④ 代码变更量趋势 */}
      <CodeChangesChart data={codeChangesData} />

      {/* ⑤ 仓库贡献分布 + ⑥ 提交类型分布 */}
      <div className="grid gap-6 md:grid-cols-2">
        <RepoDistribution data={repoDistribution} />
        <CommitTypeDistribution data={typeDistribution} />
      </div>

      {/* ⑦ 提交大小分布 */}
      <CommitSizeDistribution data={sizeDistribution} />

      {/* ⑧ 提交列表 */}
      <CommitsTable
        data={paginatedCommits}
        loading={loading}
        total={commits.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
