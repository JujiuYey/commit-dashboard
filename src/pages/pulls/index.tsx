import * as React from "react";

import { usePullRequests } from "@/hooks/use-pull-requests";
import { calculatePRMergeTime, groupPRsByStatus } from "@/utils/stats";

import { PullsStatsCards } from "./components/pulls-stats-cards";
import { PullsStatusChart } from "./components/pulls-status-chart";
import { PullsTable } from "./components/pulls-table";

export function PullsPage() {
  const [stateFilter, setStateFilter] = React.useState<"all" | "open" | "closed">("all");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const { data: prs, total, loading } = usePullRequests({ state: stateFilter, page, limit: pageSize });

  const statusStats = groupPRsByStatus(prs);
  const mergeTime = calculatePRMergeTime(prs);

  const statusBarData = [
    { status: "待处理", count: statusStats.open },
    { status: "已合并", count: statusStats.merged },
    { status: "已关闭", count: statusStats.closed },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-bold">PR 统计</h1>

      {/* 统计卡片 */}
      <PullsStatsCards stats={statusStats} mergeTime={mergeTime} />

      {/* PR 状态分布图 */}
      <PullsStatusChart data={statusBarData} />

      {/* PR 列表 */}
      <PullsTable
        data={prs}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        stateFilter={stateFilter}
        onStateFilterChange={setStateFilter}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
