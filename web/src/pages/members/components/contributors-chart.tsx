import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
  contributions: {
    label: "贡献数",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface ContributorsChartProps {
  data: Array<{
    name: string;
    contributions: number;
  }>;
}

export function ContributorsChart({ data }: ContributorsChartProps) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>贡献者排行榜</CardTitle>
        <CardDescription>按提交次数排名的 Top 贡献者</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {data.length > 0
          ? (
              <ChartContainer config={chartConfig} className="aspect-auto h-100 w-full">
                <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="contributions" fill="var(--color-contributions)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )
          : (
              <p className="text-center text-muted-foreground py-8">暂无贡献者数据</p>
            )}
      </CardContent>
    </Card>
  );
}
