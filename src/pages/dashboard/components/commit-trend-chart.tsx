import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

const chartConfig = {
  commits: {
    label: "提交数",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface CommitTrendChartProps {
  data: Array<{ date: string; count: number }>;
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
}

export function CommitTrendChart({
  data,
  timeRange,
  onTimeRangeChange,
}: CommitTrendChartProps) {
  return (
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
              onValueChange={v => v && onTimeRangeChange(v)}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
            >
              <ToggleGroupItem value="90d">90 天</ToggleGroupItem>
              <ToggleGroupItem value="30d">30 天</ToggleGroupItem>
              <ToggleGroupItem value="7d">7 天</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
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
            <AreaChart data={data}>
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
  );
}
