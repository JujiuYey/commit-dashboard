import * as React from "react";

import { useCommits } from "@/hooks/use-commits";
import type { Granularity } from "@/utils/stats";
import {
  getCommitHeatmapData,
  getCommitSizeDistribution,
  getCommitTypeDistribution,
  getCumulativeCommits,
  groupCodeChangesByDate,
  groupCommitsByDate,
} from "@/utils/stats";

import { CodeChangesChart } from "./components/code-changes-chart";
import { CommitHeatmap } from "./components/commit-heatmap";
import { CommitTrendChart } from "./components/commit-trend-chart";
import { CommitSizeDistribution } from "./components/commit-size-distribution";
import { CommitTypeDistribution } from "./components/commit-type-distribution";
import { CumulativeCommitsChart } from "./components/cumulative-commits-chart";
import { CommitsTable } from "./components/commits-table";

export function CommitsPage() {
  const [granularity, setGranularity] = React.useState<Granularity>("day");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: commits, total, loading } = useCommits({ page, limit: pageSize, since, stat: true });

  const trendData = groupCommitsByDate(commits, granularity);
  const heatmapData = getCommitHeatmapData(commits);
  const codeChangesData = groupCodeChangesByDate(commits, granularity);
  const cumulativeData = getCumulativeCommits(commits, granularity);
  const sizeDistribution = getCommitSizeDistribution(commits);
  const typeDistribution = getCommitTypeDistribution(commits);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-bold">提交记录</h1>

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
