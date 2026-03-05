import { IconGitMerge, IconGitPullRequest, IconClock } from "@tabler/icons-react";
import { type ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
import { usePullRequests } from "@/hooks/use-pull-requests";
import type { GiteaPullRequest } from "@/types/gitea";
import { calculatePRMergeTime, groupPRsByStatus } from "@/utils/stats";

const chartConfig = {
  open: { label: "待处理", color: "hsl(140 70% 45%)" },
  merged: { label: "已合并", color: "hsl(260 60% 55%)" },
  closed: { label: "已关闭", color: "hsl(0 72% 51%)" },
} satisfies ChartConfig;

const columns: ColumnDef<GiteaPullRequest>[] = [
  {
    accessorKey: "number",
    header: "#",
    cell: ({ row }) => <span className="text-muted-foreground">#{row.original.number}</span>,
  },
  {
    accessorKey: "title",
    header: "标题",
    cell: ({ row }) => (
      <span className="block max-w-md truncate font-medium">{row.original.title}</span>
    ),
  },
  {
    accessorKey: "state",
    header: "状态",
    cell: ({ row }) => {
      const pr = row.original;
      if (pr.merged) {
        return <Badge className="bg-purple-600 text-white">已合并</Badge>;
      }
      if (pr.state === "open") {
        return <Badge className="bg-green-600 text-white">待处理</Badge>;
      }
      return <Badge variant="destructive">已关闭</Badge>;
    },
  },
  {
    accessorKey: "user.login",
    header: "作者",
  },
  {
    accessorKey: "created_at",
    header: "创建时间",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("zh-CN"),
  },
];

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
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>待处理 PR</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{statusStats.open}</CardTitle>
            <CardAction>
              <Badge variant="outline"><IconGitPullRequest className="size-4" /></Badge>
            </CardAction>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>已合并 PR</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{statusStats.merged}</CardTitle>
            <CardAction>
              <Badge variant="outline"><IconGitMerge className="size-4" /></Badge>
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
              <Badge variant="outline"><IconClock className="size-4" /></Badge>
            </CardAction>
          </CardHeader>
        </Card>
      </div>

      {/* PR 状态分布图 */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>PR 状态分布</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
            <BarChart data={statusBarData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="status" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={30} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                fill="var(--primary)"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* PR 列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>PR 列表</CardTitle>
            <Select value={stateFilter} onValueChange={v => { setStateFilter(v as typeof stateFilter); setPage(1); }}>
              <SelectTrigger className="w-28" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="open">待处理</SelectItem>
                <SelectItem value="closed">已关闭</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={prs}
            loading={loading}
            emptyText="暂无 PR 记录"
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
