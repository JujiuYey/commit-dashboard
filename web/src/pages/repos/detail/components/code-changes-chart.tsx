import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const chartConfig = {
  additions: {
    label: "新增行",
    color: "oklch(0.72 0.19 149)",
  },
  deletions: {
    label: "删除行",
    color: "oklch(0.64 0.2 25)",
  },
} satisfies ChartConfig;

interface CodeChangesChartProps {
  data: Array<{
    date: string;
    additions: number;
    deletions: number;
  }>;
}

export function CodeChangesChart({ data }: CodeChangesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>代码变更量趋势</CardTitle>
        <CardDescription>按时间粒度分组的新增和删除行数</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
          <AreaChart data={data}>
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
  );
}
