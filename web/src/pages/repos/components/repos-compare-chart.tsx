import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const chartConfig = {
  stars: { label: "Star 数", color: "hsl(45 93% 47%)" },
  forks: { label: "Fork 数", color: "hsl(200 80% 50%)" },
  issues: { label: "待处理 Issue", color: "hsl(0 72% 51%)" },
} satisfies ChartConfig;

interface ReposCompareChartProps {
  data: Array<{
    name: string;
    stars: number;
    forks: number;
    issues: number;
  }>;
}

export function ReposCompareChart({ data }: ReposCompareChartProps) {
  if (data.length === 0) return null;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>仓库多维对比</CardTitle>
        <CardDescription>所选仓库的 Star、Fork 和待处理 Issue 对比</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={30} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="stars" fill="var(--color-stars)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="forks" fill="var(--color-forks)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="issues" fill="var(--color-issues)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
