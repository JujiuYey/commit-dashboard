import { useState } from "react";

import type { RepoItem } from "@/api/gitea/repos";

import { ConnectionInfo } from "./components/connection-info";
import { RepoCommitSync } from "./components/repo-commit-sync";
import { RepoSelector } from "./components/repo-selector";

export function SettingsPage() {
  const [syncRepo, setSyncRepo] = useState<RepoItem | null>(null);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-bold">设置</h1>

      <ConnectionInfo />

      {syncRepo
        ? (
            <RepoCommitSync repo={syncRepo} onBack={() => setSyncRepo(null)} />
          )
        : (
            <RepoSelector onSyncRepo={repo => setSyncRepo(repo)} />
          )}
    </div>
  );
}
