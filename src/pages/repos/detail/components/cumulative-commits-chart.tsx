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
  total: {
    label: "累计提交",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface CumulativeCommitsChartProps {
  data: Array<{
    date: string;
    total: number;
  }>;
}

export function CumulativeCommitsChart({ data }: CumulativeCommitsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>累计提交曲线</CardTitle>
        <CardDescription>提交总量随时间的增长趋势</CardDescription>
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
  );
}
