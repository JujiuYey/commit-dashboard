import { IconGitMerge, IconGitPullRequest, IconClock } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PullRequestStats {
  open: number;
  merged: number;
  closed: number;
}

interface PullsStatsCardsProps {
  stats: PullRequestStats;
  mergeTime: {
    average: number;
  };
}

export function PullsStatsCards({ stats, mergeTime }: PullsStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>待处理 PR</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{stats.open}</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconGitPullRequest className="size-4" />
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>已合并 PR</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{stats.merged}</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconGitMerge className="size-4" />
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>平均合并时间</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            {mergeTime.average > 0 ? `${mergeTime.average.toFixed(1)}h` : "暂无"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconClock className="size-4" />
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  );
}
