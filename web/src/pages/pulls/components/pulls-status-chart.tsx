import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const chartConfig = {
  open: { label: "待处理", color: "hsl(140 70% 45%)" },
  merged: { label: "已合并", color: "hsl(260 60% 55%)" },
  closed: { label: "已关闭", color: "hsl(0 72% 51%)" },
} satisfies ChartConfig;

interface PullsStatusChartProps {
  data: Array<{
    status: string;
    count: number;
  }>;
}

export function PullsStatusChart({ data }: PullsStatusChartProps) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>PR 状态分布</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="status" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={30} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--primary)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
