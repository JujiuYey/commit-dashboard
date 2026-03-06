import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/sag-ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GiteaPullRequest } from "@/types/gitea";

const columns: ColumnDef<GiteaPullRequest>[] = [
  {
    accessorKey: "number",
    header: "#",
    cell: ({ row }) => <span className="text-muted-foreground">#{row.original.number}</span>,
  },
  {
    accessorKey: "title",
    header: "标题",
    cell: ({ row }) => (
      <span className="block max-w-md truncate font-medium">{row.original.title}</span>
    ),
  },
  {
    accessorKey: "state",
    header: "状态",
    cell: ({ row }) => {
      const pr = row.original;
      if (pr.merged) {
        return <Badge className="bg-purple-600 text-white">已合并</Badge>;
      }
      if (pr.state === "open") {
        return <Badge className="bg-green-600 text-white">待处理</Badge>;
      }
      return <Badge variant="destructive">已关闭</Badge>;
    },
  },
  {
    accessorKey: "user.login",
    header: "作者",
  },
  {
    accessorKey: "created_at",
    header: "创建时间",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("zh-CN"),
  },
];

interface PullsTableProps {
  data: GiteaPullRequest[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  stateFilter: "all" | "open" | "closed";
  onStateFilterChange: (value: "all" | "open" | "closed") => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PullsTable({
  data,
  loading,
  total,
  page,
  pageSize,
  stateFilter,
  onStateFilterChange,
  onPageChange,
  onPageSizeChange,
}: PullsTableProps) {
  const handleStateFilterChange = (value: string) => {
    onStateFilterChange(value as "all" | "open" | "closed");
    onPageChange(1);
  };

  const handlePageSizeChange = (size: number) => {
    onPageSizeChange(size);
    onPageChange(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>PR 列表</CardTitle>
          <Select value={stateFilter} onValueChange={handleStateFilterChange}>
            <SelectTrigger className="w-28" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="open">待处理</SelectItem>
              <SelectItem value="closed">已关闭</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyText="暂无 PR 记录"
          pagination={{
            page,
            pageSize,
            total,
            onPageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
        />
      </CardContent>
    </Card>
  );
}
