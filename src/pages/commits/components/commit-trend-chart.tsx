import * as React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
import type { Granularity } from "@/utils/stats";

const chartConfig = {
  count: {
    label: "提交数",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface CommitTrendChartProps {
  data: Array<{ date: string; count: number }>;
  granularity: Granularity;
  onGranularityChange: (value: Granularity) => void;
}

export function CommitTrendChart({
  data,
  granularity,
  onGranularityChange,
}: CommitTrendChartProps) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>提交趋势</CardTitle>
        <CardDescription>按时间粒度分组的提交数量</CardDescription>
        <CardAction>
          <Select
            value={granularity}
            onValueChange={(v) => onGranularityChange(v as Granularity)}
          >
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
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(v) =>
                new Date(v).toLocaleDateString("zh-CN", {
                  month: "short",
                  day: "numeric",
                })
              }
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
  );
}
