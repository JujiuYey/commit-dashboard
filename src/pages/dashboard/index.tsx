import {
  IconGitCommit,
  IconGitPullRequest,
  IconClock,
  IconUsers,
} from "@tabler/icons-react";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
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

const chartConfig = {
  commits: {
    label: "提交数",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

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
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <StatCard
          title="总提交数"
          value={commits.length.toString()}
          icon={<IconGitCommit className="size-4" />}
        />
        <StatCard
          title="贡献者"
          value={contributors.length.toString()}
          icon={<IconUsers className="size-4" />}
        />
        <StatCard
          title="待处理 PR"
          value={prStats.open.toString()}
          icon={<IconGitPullRequest className="size-4" />}
        />
        <StatCard
          title="平均合并时间"
          value={mergeTime.average > 0 ? `${mergeTime.average.toFixed(1)}h` : "暂无"}
          icon={<IconClock className="size-4" />}
        />
      </div>

      {/* 提交趋势图 */}
      <div className="px-4 lg:px-6">
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>提交趋势</CardTitle>
            <CardDescription>
              所选时间范围内的提交数量
            </CardDescription>
            <CardAction>
              <ToggleGroup
                type="single"
                value={timeRange}
                onValueChange={v => v && setTimeRange(v)}
                variant="outline"
                className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
              >
                <ToggleGroupItem value="90d">90 天</ToggleGroupItem>
                <ToggleGroupItem value="30d">30 天</ToggleGroupItem>
                <ToggleGroupItem value="7d">7 天</ToggleGroupItem>
              </ToggleGroup>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32 @[767px]/card:hidden" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90d">90 天</SelectItem>
                  <SelectItem value="30d">30 天</SelectItem>
                  <SelectItem value="7d">7 天</SelectItem>
                </SelectContent>
              </Select>
            </CardAction>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillCommits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-commits)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-commits)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={v => new Date(v).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="count"
                  name="提交数"
                  type="natural"
                  fill="url(#fillCommits)"
                  stroke="var(--color-commits)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* 最近提交 */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>最近提交</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>提交信息</TableHead>
                    <TableHead>作者</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>SHA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commitsLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 4 }).map((_, j) => (
                            <TableCell key={j}>
                              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : commits.slice(0, 10).map(c => (
                        <TableRow key={c.sha}>
                          <TableCell className="max-w-xs truncate font-medium">
                            {c.commit.message.split("\n")[0]}
                          </TableCell>
                          <TableCell>{c.commit.author.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(c.commit.committer.date).toLocaleDateString("zh-CN")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {c.sha.slice(0, 7)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  {!commitsLoading && commits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        暂无提交记录
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="@container/card *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card bg-linear-to-t shadow-xs">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">{icon}</Badge>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
