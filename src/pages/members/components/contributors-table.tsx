import { Link } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuthorStats {
  email: string;
  name: string;
  login?: string;
  avatarUrl?: string;
  count: number;
  additions: number;
  deletions: number;
}

interface ContributorsTableProps {
  data: AuthorStats[];
  loading: boolean;
}

export function ContributorsTable({ data, loading }: ContributorsTableProps) {
  return (
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
                : data.map(a => (
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
              {!loading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">暂无数据</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
