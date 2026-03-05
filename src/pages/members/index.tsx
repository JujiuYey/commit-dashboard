import { Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContributors } from "@/hooks/use-contributors";
import { useCommits } from "@/hooks/use-commits";
import { groupCommitsByAuthor } from "@/utils/stats";

const chartConfig = {
  contributions: {
    label: "贡献数",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function MembersPage() {
  const { data: contributors, loading } = useContributors();
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: commits } = useCommits({ limit: 50, since, stat: true });

  const authorStats = groupCommitsByAuthor(commits);

  const barData = contributors.slice(0, 15).map(c => ({
    name: c.full_name || c.login,
    contributions: c.contributions,
  }));

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-bold">成员贡献</h1>

      {/* 贡献者排行 */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>贡献者排行榜</CardTitle>
          <CardDescription>按提交次数排名的 Top 贡献者</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {barData.length > 0
            ? (
                <ChartContainer config={chartConfig} className="aspect-auto h-100 w-full">
                  <BarChart data={barData} layout="vertical" margin={{ left: 80 }}>
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

      {/* 贡献者详情表格 */}
      <Card>
        <CardHeader>
          <CardTitle>贡献者详情</CardTitle>
          <CardDescription>近 90 天内各作者的详细提交统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>作者</TableHead>
                  <TableHead className="text-right">提交数</TableHead>
                  <TableHead className="text-right">新增行数</TableHead>
                  <TableHead className="text-right">删除行数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : authorStats.map(a => (
                      <TableRow key={a.email}>
                        <TableCell>
                          {a.login ? (
                            <Link
                              to="/members/$login"
                              params={{ login: a.login }}
                              className="flex items-center gap-2 hover:underline"
                            >
                              <Avatar className="size-6">
                                <AvatarImage src={a.avatarUrl} />
                                <AvatarFallback>{a.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{a.name}</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Avatar className="size-6">
                                <AvatarImage src={a.avatarUrl} />
                                <AvatarFallback>{a.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{a.name}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{a.count}</TableCell>
                        <TableCell className="text-right tabular-nums text-green-600">+{a.additions}</TableCell>
                        <TableCell className="text-right tabular-nums text-red-600">-{a.deletions}</TableCell>
                      </TableRow>
                    ))}
                {!loading && authorStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">暂无数据</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
