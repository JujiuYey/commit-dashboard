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
  count: {
    label: "提交数",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface CommitTypeDistributionProps {
  data: Array<{
    type: string;
    count: number;
  }>;
}

export function CommitTypeDistribution({ data }: CommitTypeDistributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>提交类型分布</CardTitle>
        <CardDescription>基于 Conventional Commits 规范提取</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
          <BarChart data={data} layout="vertical">
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="type" tickLine={false} axisLine={false} width={60} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" name="提交数" fill="var(--primary)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
