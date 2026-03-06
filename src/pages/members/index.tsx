import { useContributors } from "@/hooks/use-contributors";
import { useCommits } from "@/hooks/use-commits";
import { groupCommitsByAuthor } from "@/utils/stats";

import { ContributorsChart } from "./components/contributors-chart";
import { ContributorsTable } from "./components/contributors-table";

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
      <ContributorsChart data={barData} />

      {/* 贡献者详情表格 */}
      <ContributorsTable data={authorStats} loading={loading} />
    </div>
  );
}
