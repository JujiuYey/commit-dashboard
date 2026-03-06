import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/sag-ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CommitItem } from "@/api/gitea/commits";

const columns: ColumnDef<CommitItem>[] = [
  {
    accessorKey: "message",
    header: "提交信息",
    cell: ({ row }) => (
      <span className="block max-w-md truncate font-medium">
        {row.original.message.split("\n")[0]}
      </span>
    ),
  },
  {
    accessorKey: "author_name",
    header: "作者",
  },
  {
    accessorKey: "committed_at",
    header: "日期",
    cell: ({ row }) =>
      new Date(row.original.committed_at).toLocaleString("zh-CN"),
  },
  {
    accessorKey: "sha",
    header: "SHA",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono text-xs">
        {row.original.sha.slice(0, 7)}
      </Badge>
    ),
  },
];

interface CommitsTableProps {
  data: CommitItem[];
  loading?: boolean;
  total?: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function CommitsTable({
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: CommitsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>全部提交</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          emptyText="暂无提交记录"
          pagination={{
            page,
            pageSize,
            total: total || 0,
            onPageChange,
            onPageSizeChange: (s) => {
              onPageSizeChange(s);
              onPageChange(1);
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
