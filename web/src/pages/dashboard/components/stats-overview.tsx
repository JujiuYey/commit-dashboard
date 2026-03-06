import {
  IconGitCommit,
  IconGitPullRequest,
  IconClock,
  IconUsers,
} from "@tabler/icons-react";

import { StatCard } from "./stat-card";

interface StatsOverviewProps {
  commitsCount: number;
  contributorsCount: number;
  openPRsCount: number;
  averageMergeTime: number;
}

export function StatsOverview({
  commitsCount,
  contributorsCount,
  openPRsCount,
  averageMergeTime,
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-4 gap-4 px-4 lg:px-6">
      <StatCard
        title="总提交数"
        value={commitsCount.toString()}
        icon={<IconGitCommit className="size-4" />}
      />
      <StatCard
        title="贡献者"
        value={contributorsCount.toString()}
        icon={<IconUsers className="size-4" />}
      />
      <StatCard
        title="待处理 PR"
        value={openPRsCount.toString()}
        icon={<IconGitPullRequest className="size-4" />}
      />
      <StatCard
        title="平均合并时间"
        value={averageMergeTime > 0 ? `${averageMergeTime.toFixed(1)}h` : "暂无"}
        icon={<IconClock className="size-4" />}
      />
    </div>
  );
}
