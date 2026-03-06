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

interface CommitSizeDistributionProps {
  data: Array<{
    size: string;
    count: number;
  }>;
}

export function CommitSizeDistribution({ data }: CommitSizeDistributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>提交大小分布</CardTitle>
        <CardDescription>按变更行数分桶统计</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="size" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={30} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" name="提交数" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
