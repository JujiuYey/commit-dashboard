import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PeriodCardProps {
  title: string;
  stats: { repo: string; count: number }[];
}

export function PeriodCard({ title, stats }: PeriodCardProps) {
  const totalCommits = stats.reduce((s, r) => s + r.count, 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <p className="text-2xl font-bold tabular-nums">{totalCommits} <span className="text-sm font-normal text-muted-foreground">次提交</span></p>
      </CardHeader>
      <CardContent>
        {stats.length > 0 ? (
          <ul className="space-y-1">
            {stats.map(r => (
              <li key={r.repo} className="flex items-center justify-between text-sm">
                <span className="truncate text-muted-foreground">{r.repo}</span>
                <span className="tabular-nums font-medium">{r.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">暂无提交</p>
        )}
      </CardContent>
    </Card>
  );
}
