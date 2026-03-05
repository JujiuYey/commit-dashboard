import { type ColumnDef } from "@tanstack/react-table";
import { Link, useParams } from "@tanstack/react-router";
import { IconArrowLeft } from "@tabler/icons-react";
import * as React from "react";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { DataTable } from "@/components/sag-ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const chartConfig = {
  count: {
    label: "提交数",
    color: "var(--primary)",
  },
  additions: {
    label: "新增行",
    color: "oklch(0.72 0.19 149)",
  },
  deletions: {
    label: "删除行",
    color: "oklch(0.64 0.2 25)",
  },
} satisfies ChartConfig;

const columns: ColumnDef<GiteaCommit>[] = [
  {
    accessorKey: "commit.message",
    header: "提交信息",
    cell: ({ row }) => (
      <span className="block max-w-md truncate font-medium">
        {row.original.commit.message.split("\n")[0]}
      </span>
    ),
  },
  {
    accessorKey: "commit.committer.date",
    header: "日期",
    cell: ({ row }) => new Date(row.original.commit.committer.date).toLocaleString("zh-CN"),
  },
  {
    accessorKey: "sha",
    header: "SHA",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono text-xs">
        {row.original.sha.slice(0, 7)}
      </Badge>
    ),
  },
];

const DAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

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
  const { data: commits, byRepo, total, loading } = useMemberCommits(login, {
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

  const maxHeat = Math.max(1, ...heatmapData.map(d => d.count));

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
            <Avatar className="size-8">
              <AvatarImage src={authorInfo.author.avatar_url} />
              <AvatarFallback>{login.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
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
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>提交趋势</CardTitle>
          <CardDescription>按时间粒度分组的提交数量</CardDescription>
          <CardAction>
            <Select value={granularity} onValueChange={v => setGranularity(v as Granularity)}>
              <SelectTrigger className="w-28" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">按天</SelectItem>
                <SelectItem value="week">按周</SelectItem>
                <SelectItem value="month">按月</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <LineChart data={trendData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={v => new Date(v).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
              />
              <YAxis tickLine={false} axisLine={false} width={30} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Line
                dataKey="count"
                name="提交数"
                type="monotone"
                stroke="var(--color-count)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ③ 活跃热力图 */}
      <Card>
        <CardHeader>
          <CardTitle>活跃热力图</CardTitle>
          <CardDescription>按星期和小时统计的提交分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `auto repeat(24, 1fr)` }}>
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-xs text-muted-foreground text-center">{h}</div>
              ))}
              {DAYS.map((day, dayIdx) => (
                <React.Fragment key={day}>
                  <div className="text-xs text-muted-foreground pr-2 flex items-center">{day}</div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const cell = heatmapData.find(d => d.day === dayIdx && d.hour === h);
                    const count = cell?.count ?? 0;
                    const opacity = count / maxHeat;
                    return (
                      <div
                        key={h}
                        className="aspect-square rounded-sm"
                        style={{ backgroundColor: count > 0 ? `oklch(0.65 0.2 145 / ${0.15 + opacity * 0.85})` : "var(--muted)" }}
                        title={`${day} ${h}:00 - ${count} 次提交`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ④ 代码变更量趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>代码变更量趋势</CardTitle>
          <CardDescription>按时间粒度分组的新增和删除行数</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={codeChangesData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={v => new Date(v).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
              />
              <YAxis tickLine={false} axisLine={false} width={50} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="additions"
                name="新增行"
                type="monotone"
                fill="var(--color-additions)"
                fillOpacity={0.3}
                stroke="var(--color-additions)"
                strokeWidth={2}
                stackId="a"
              />
              <Area
                dataKey="deletions"
                name="删除行"
                type="monotone"
                fill="var(--color-deletions)"
                fillOpacity={0.3}
                stroke="var(--color-deletions)"
                strokeWidth={2}
                stackId="b"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ⑤ 仓库贡献分布 + ⑥ 提交类型分布 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>仓库贡献分布</CardTitle>
            <CardDescription>各仓库的提交数占比</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <BarChart data={repoDistribution} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="repo"
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" name="提交数" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>提交类型分布</CardTitle>
            <CardDescription>基于 Conventional Commits 规范提取</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <BarChart data={typeDistribution} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="type" tickLine={false} axisLine={false} width={60} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" name="提交数" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ⑦ 提交大小分布 */}
      <Card>
        <CardHeader>
          <CardTitle>提交大小分布</CardTitle>
          <CardDescription>按变更行数分桶统计</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <BarChart data={sizeDistribution}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="size" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={30} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" name="提交数" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ⑧ 提交列表 */}
      <Card>
        <CardHeader>
          <CardTitle>全部提交</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={paginatedCommits}
            loading={loading}
            emptyText="暂无提交记录"
            pagination={{
              page,
              pageSize,
              total: commits.length,
              onPageChange: setPage,
              onPageSizeChange: (s) => { setPageSize(s); setPage(1); },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PeriodCard({ title, stats }: { title: string; stats: { repo: string; count: number }[] }) {
  const totalCommits = stats.reduce((s, r) => s + r.count, 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <p className="text-2xl font-bold tabular-nums">{totalCommits} <span className="text-sm font-normal text-muted-foreground">次提交</span></p>
      </CardHeader>
      <CardContent>
        {stats.length > 0 ? (
          <ul className="space-y-1">
            {stats.map(r => (
              <li key={r.repo} className="flex items-center justify-between text-sm">
                <span className="truncate text-muted-foreground">{r.repo}</span>
                <span className="tabular-nums font-medium">{r.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">暂无提交</p>
        )}
      </CardContent>
    </Card>
  );
}
