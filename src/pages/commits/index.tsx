import { type ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { DataTable } from "@/components/sag-ui/data-table";
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
import { useCommits } from "@/hooks/use-commits";
import type { GiteaCommit } from "@/types/gitea";
import {
  type Granularity,
  getCommitHeatmapData,
  getCommitSizeDistribution,
  getCommitTypeDistribution,
  getCumulativeCommits,
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
  total: {
    label: "累计提交",
    color: "var(--primary)",
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
    accessorKey: "commit.author.name",
    header: "作者",
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

  const maxHeat = Math.max(1, ...heatmapData.map(d => d.count));

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-bold">提交记录</h1>

      {/* 趋势图 */}
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
          <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
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

      {/* 热力图 */}
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

      {/* 代码变更量趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>代码变更量趋势</CardTitle>
          <CardDescription>按时间粒度分组的新增和删除行数</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-62.5full">
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

      {/* 累计提交曲线 */}
      <Card>
        <CardHeader>
          <CardTitle>累计提交曲线</CardTitle>
          <CardDescription>提交总量随时间的增长趋势</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-62.5full">
            <AreaChart data={cumulativeData}>
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
                dataKey="total"
                name="累计提交"
                type="monotone"
                fill="var(--color-total)"
                fillOpacity={0.2}
                stroke="var(--color-total)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* 提交大小分布 + 提交类型分布 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>提交大小分布</CardTitle>
            <CardDescription>按变更行数分桶统计</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
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

        <Card>
          <CardHeader>
            <CardTitle>提交类型分布</CardTitle>
            <CardDescription>基于 Conventional Commits 规范提取</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
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

      {/* 提交列表 */}
      <Card>
        <CardHeader>
          <CardTitle>全部提交</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={commits}
            loading={loading}
            emptyText="暂无提交记录"
            pagination={{
              page,
              pageSize,
              total,
              onPageChange: setPage,
              onPageSizeChange: (s) => { setPageSize(s); setPage(1); },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
