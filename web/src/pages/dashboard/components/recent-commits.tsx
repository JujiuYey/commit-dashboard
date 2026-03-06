import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
import type { CommitItem } from "@/api/gitea/commits";

interface RecentCommitsProps {
  commits: CommitItem[];
  loading?: boolean;
  limit?: number;
}

export function RecentCommits({
  commits,
  loading = false,
  limit = 10,
}: RecentCommitsProps) {
  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>最近提交</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>提交信息</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>SHA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : commits.slice(0, limit).map(c => (
                      <TableRow key={c.sha}>
                        <TableCell className="max-w-xs truncate font-medium">
                          {c.message.split("\n")[0]}
                        </TableCell>
                        <TableCell>{c.author_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(c.committed_at).toLocaleDateString("zh-CN")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {c.sha.slice(0, 7)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                {!loading && commits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      暂无提交记录
                    </TableCell>
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
