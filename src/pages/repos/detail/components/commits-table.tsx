import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/sag-ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GiteaCommit } from "@/types/gitea";

const columns: ColumnDef<GiteaCommit>[] = [
  {
    accessorKey: "commit.message",
    header: "提交信息",
    cell: ({ row }) => (
      <span className="block max-w-md truncate font-medium">
        {row.original.commit.message.split("\n")[0]}
      </span>
    ),
  },
  {
    accessorKey: "commit.author.name",
    header: "作者",
  },
  {
    accessorKey: "commit.committer.date",
    header: "日期",
    cell: ({ row }) => new Date(row.original.commit.committer.date).toLocaleString("zh-CN"),
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
  data: GiteaCommit[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
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
  const handlePageSizeChange = (size: number) => {
    onPageSizeChange(size);
    onPageChange(1);
  };

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
            total,
            onPageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
        />
      </CardContent>
    </Card>
  );
}
