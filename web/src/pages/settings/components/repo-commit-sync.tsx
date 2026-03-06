import { IconArrowLeft, IconCheck, IconLoader2 } from "@tabler/icons-react";
import { useState } from "react";

import { syncApi } from "@/api";
import type { RepoItem } from "@/api/gitea/repos";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RepoCommitSyncProps {
  repo: RepoItem;
  onBack: () => void;
}

interface SyncState {
  status: "idle" | "syncing" | "done" | "error";
  result?: {
    new_commits: number;
  };
  error?: string;
}

export function RepoCommitSync({ repo, onBack }: RepoCommitSyncProps) {
  const [syncState, setSyncState] = useState<SyncState>({ status: "idle" });

  const handleSync = async () => {
    setSyncState({ status: "syncing" });
    try {
      const res = await syncApi.syncRepoCommits(repo.id);
      setSyncState({
        status: "done",
        result: {
          new_commits: res?.new_commits ?? 0,
        },
      });
    }
    catch {
      setSyncState({ status: "error", error: "同步失败" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={onBack}>
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <CardTitle>{repo.full_name}</CardTitle>
            <CardDescription>
              {repo.description || "拉取该仓库的提交记录"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground mb-1">默认分支</p>
              <p className="font-medium">{repo.default_branch}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground mb-1">Star</p>
              <p className="font-medium">{repo.stars_count}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground mb-1">上次同步</p>
              <p className="font-medium">
                {repo.synced_at
                  ? new Date(repo.synced_at).toLocaleString("zh-CN")
                  : "从未同步"}
              </p>
            </div>
          </div>

          {syncState.status === "done" && syncState.result && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400 mb-2">
                <IconCheck className="size-4" />
                同步完成
              </div>
              <div className="text-muted-foreground">
                <span>
                  新增提交：
                  <span className="font-medium text-foreground">{syncState.result.new_commits}</span>
                  条
                </span>
              </div>
            </div>
          )}

          {syncState.status === "error" && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
              {syncState.error}
            </div>
          )}

          <Button
            onClick={handleSync}
            disabled={syncState.status === "syncing"}
            className="self-start"
          >
            {syncState.status === "syncing"
              ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                    同步中...
                  </>
                )
              : "拉取提交记录"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
