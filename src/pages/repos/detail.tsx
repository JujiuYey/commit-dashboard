import { Link, useParams } from "@tanstack/react-router";
import { IconArrowLeft } from "@tabler/icons-react";
import * as React from "react";

import { useRepoCommits } from "@/hooks/use-repo-commits";
import type { Granularity } from "@/utils/stats";
import {
  getCommitHeatmapData,
  getCommitSizeDistribution,
  getCommitTypeDistribution,
  getCumulativeCommits,
  groupCodeChangesByDate,
  groupCommitsByDate,
} from "@/utils/stats";

import { CommitTrendChart } from "./detail/components/commit-trend-chart";
import { CommitHeatmap } from "./detail/components/commit-heatmap";
import { CodeChangesChart } from "./detail/components/code-changes-chart";
import { CumulativeCommitsChart } from "./detail/components/cumulative-commits-chart";
import { CommitSizeDistribution } from "./detail/components/commit-size-distribution";
import { CommitTypeDistribution } from "./detail/components/commit-type-distribution";
import { CommitsTable } from "./detail/components/commits-table";

export function RepoDetailPage() {
  const { owner, repo } = useParams({ from: "/_layout/repos/$owner/$repo" });
  const [granularity, setGranularity] = React.useState<Granularity>("day");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: commits, total, loading } = useRepoCommits(owner, repo, {
    page,
    limit: pageSize,
    since,
    stat: true,
  });

  const trendData = groupCommitsByDate(commits, granularity);
  const heatmapData = getCommitHeatmapData(commits);
  const codeChangesData = groupCodeChangesByDate(commits, granularity);
  const cumulativeData = getCumulativeCommits(commits, granularity);
  const sizeDistribution = getCommitSizeDistribution(commits);
  const typeDistribution = getCommitTypeDistribution(commits);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Link to="/repos" className="text-muted-foreground hover:text-foreground transition-colors">
          <IconArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold">{owner}/{repo}</h1>
      </div>

      {/* 趋势图 */}
      <CommitTrendChart
        data={trendData}
        granularity={granularity}
        onGranularityChange={setGranularity}
      />

      {/* 热力图 */}
      <CommitHeatmap data={heatmapData} />

      {/* 代码变更量趋势 */}
      <CodeChangesChart data={codeChangesData} />

      {/* 累计提交曲线 */}
      <CumulativeCommitsChart data={cumulativeData} />

      {/* 提交大小分布 + 提交类型分布 */}
      <div className="grid gap-6 md:grid-cols-2">
        <CommitSizeDistribution data={sizeDistribution} />
        <CommitTypeDistribution data={typeDistribution} />
      </div>

      {/* 提交列表 */}
      <CommitsTable
        data={commits}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
