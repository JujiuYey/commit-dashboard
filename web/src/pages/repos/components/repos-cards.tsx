import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconAlertCircle, IconGitFork, IconStar } from "@tabler/icons-react";
import type { RepoItem } from "@/api/gitea/repos";

interface ReposCardsProps {
  repos: RepoItem[];
  loading: boolean;
}

export function ReposCards({ repos, loading }: ReposCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 w-32 animate-pulse rounded bg-muted mb-2" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <p className="col-span-full text-center text-muted-foreground py-8">暂无仓库数据，请先同步</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {repos.map(repo => (
        <Link
          key={repo.id}
          to="/repos/$owner/$repo"
          params={{ owner: repo.owner, repo: repo.name }}
          className="block rounded-xl transition-shadow hover:shadow-md hover:ring-1 hover:ring-border"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{repo.full_name}</CardTitle>
              {repo.description && (
                <CardDescription className="line-clamp-2">{repo.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <Badge variant="secondary">{repo.default_branch}</Badge>
                <span className="flex items-center gap-1">
                  <IconStar className="size-3.5" />
                  {repo.stars_count}
                </span>
                <span className="flex items-center gap-1">
                  <IconGitFork className="size-3.5" />
                  {repo.forks_count}
                </span>
                <span className="flex items-center gap-1">
                  <IconAlertCircle className="size-3.5" />
                  {repo.open_issues_count}
                </span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                同步于 {new Date(repo.synced_at).toLocaleDateString("zh-CN")}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
