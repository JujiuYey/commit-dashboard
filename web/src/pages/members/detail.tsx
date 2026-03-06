import { Link, useParams } from "@tanstack/react-router";
import { IconArrowLeft } from "@tabler/icons-react";
import * as React from "react";

import type { CommitItem } from "@/api/gitea/commits";
import { useMemberCommits } from "@/hooks/use-member-commits";
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

function filterByDate(commits: CommitItem[], sinceMs: number): CommitItem[] {
  return commits.filter(c => new Date(c.committed_at).getTime() >= sinceMs);
}

function getRepoStats(commits: CommitItem[]): { repo: string; count: number }[] {
  const map = new Map<string, number>();
  for (const c of commits) {
    map.set(c.repo_name, (map.get(c.repo_name) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([repo, count]) => ({ repo, count }))
    .sort((a, b) => b.count - a.count);
}

export function MemberDetailPage() {
  const { login } = useParams({ from: "/_layout/members/$login" });
  const [granularity, setGranularity] = React.useState<Granularity>("day");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const startDate = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const { data: commits, loading } = useMemberCommits(login, {
    start_date: startDate,
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

  const todayStats = getRepoStats(filterByDate(commits, todayStart.getTime()));
  const weekStats = getRepoStats(filterByDate(commits, weekStart.getTime()));
  const monthStats = getRepoStats(filterByDate(commits, monthStart.getTime()));

  const repoDistribution = React.useMemo(() => getRepoStats(commits), [commits]);

  const authorName = commits[0]?.author_name ?? login;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/members" className="text-muted-foreground hover:text-foreground transition-colors">
          <IconArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{authorName}</h1>
          <p className="text-sm text-muted-foreground">@{login}</p>
        </div>
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
