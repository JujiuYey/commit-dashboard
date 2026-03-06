import {
  IconGitCommit,
} from "@tabler/icons-react";
import * as React from "react";

import { useCommits } from "@/hooks/use-commits";
import { useContributors } from "@/hooks/use-contributors";
import { usePullRequests } from "@/hooks/use-pull-requests";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGiteaStore } from "@/stores/gitea";
import {
  calculatePRMergeTime,
  groupCommitsByDate,
  groupPRsByStatus,
} from "@/utils/stats";
import { StatsOverview } from "./components/stats-overview";
import { CommitTrendChart } from "./components/commit-trend-chart";
import { RecentCommits } from "./components/recent-commits";

export function DashboardPage() {
  const selectedRepos = useGiteaStore(s => s.selectedRepos);
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("30d");

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d");
  }, [isMobile]);

  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[timeRange] ?? 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: commits, loading: commitsLoading } = useCommits({ limit: 50, since });
  const { data: contributors } = useContributors();
  const { data: prs } = usePullRequests();

  const prStats = groupPRsByStatus(prs);
  const mergeTime = calculatePRMergeTime(prs);
  const chartData = groupCommitsByDate(commits, "day");

  if (selectedRepos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
        <IconGitCommit className="size-12" />
        <p className="text-lg">尚未选择仓库</p>
        <p className="text-sm">请前往「设置」页面选择需要分析的仓库</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* 统计卡片 */}
      <StatsOverview
        commitsCount={commits.length}
        contributorsCount={contributors.length}
        openPRsCount={prStats.open}
        averageMergeTime={mergeTime.average}
      />

      {/* 提交趋势图 */}
      <CommitTrendChart
        data={chartData}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* 最近提交 */}
      <RecentCommits commits={commits} loading={commitsLoading} />
    </div>
  );
}
