import { type ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
import { type Granularity, getCommitHeatmapData, groupCommitsByDate } from "@/utils/stats";

const chartConfig = {
  count: {
    label: "提交数",
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

      {/* 热力图 */}
      <Card>
        <CardHeader>
          <CardTitle>活跃热力图</CardTitle>
          <CardDescription>按星期和小时统计的提交分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `auto repeat(24, 1fr)` }}>
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-xs text-muted-foreground text-center w-6">{h}</div>
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
                        className="w-6 h-6 rounded-sm"
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
