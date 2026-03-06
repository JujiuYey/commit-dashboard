import { IconCheck, IconChevronRight, IconLoader2, IconRefresh, IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useRepos } from "@/hooks/use-repos";
import { useGiteaStore } from "@/stores/gitea";
import type { RepoIdentifier } from "@/types/gitea";

interface RepoSelectorProps {
  onSyncRepo?: (repo: RepoItem) => void;
}

export function RepoSelector({ onSyncRepo }: RepoSelectorProps) {
  const { selectedRepos, setSelectedRepos } = useGiteaStore();
  const { data: repos, loading, refetch } = useRepos();
  const [localSelected, setLocalSelected] = useState<RepoIdentifier[]>(selectedRepos);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLocalSelected(selectedRepos);
  }, [selectedRepos]);

  const isSelected = (owner: string, repo: string) =>
    localSelected.some(r => r.owner === owner && r.repo === repo);

  const toggleRepo = (owner: string, repo: string) => {
    if (isSelected(owner, repo)) {
      setLocalSelected(prev => prev.filter(r => !(r.owner === owner && r.repo === repo)));
    }
    else {
      setLocalSelected(prev => [...prev, { owner, repo }]);
    }
  };

  const handleSave = () => {
    setSelectedRepos(localSelected);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncApi.syncRepos();
      await refetch();
    }
    finally {
      setSyncing(false);
    }
  };

  const filteredRepos = repos.filter(repo =>
    repo.full_name.toLowerCase().includes(search.toLowerCase())
    || repo.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>仓库选择</CardTitle>
            <CardDescription>选择需要分析的仓库</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSync} size="sm" variant="outline" disabled={syncing}>
              <IconRefresh className={`mr-1 size-4 ${syncing ? "animate-spin" : ""}`} />
              拉取仓库
            </Button>
            <Button onClick={handleSave} size="sm">
              <IconCheck className="mr-1 size-4" />
              保存选择
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading
          ? (
              <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                <IconLoader2 className="size-4 animate-spin" />
                加载仓库列表中...
              </div>
            )
          : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="搜索仓库..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                      <Checkbox
                        checked={filteredRepos.length > 0 && filteredRepos.every(r => isSelected(r.owner, r.name))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setLocalSelected(prev => [
                              ...prev,
                              ...filteredRepos.filter(r => !isSelected(r.owner, r.name)).map(r => ({ owner: r.owner, repo: r.name })),
                            ]);
                          }
                          else {
                            setLocalSelected(prev => prev.filter(r => !filteredRepos.some(fr => fr.owner === r.owner && fr.name === r.repo)));
                          }
                        }}
                      />
                      全选
                    </label>
                    <span className="text-sm text-muted-foreground">
                      共
                      {" "}
                      <span className="font-medium text-foreground">{repos.length}</span>
                      {" "}
                      个仓库，已选
                      {" "}
                      <span className="font-medium text-foreground">{localSelected.length}</span>
                      {" "}
                      个
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {filteredRepos.map(repo => (
                    <label
                      key={repo.id}
                      className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={isSelected(repo.owner, repo.name)}
                        onCheckedChange={() => toggleRepo(repo.owner, repo.name)}
                      />
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="font-medium text-sm truncate">{repo.full_name}</span>
                        {repo.description && (
                          <span className="text-xs text-muted-foreground truncate">{repo.description}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          onSyncRepo?.(repo);
                        }}
                        className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <IconChevronRight className="size-4" />
                      </button>
                    </label>
                  ))}
                  {filteredRepos.length === 0 && (
                    <p className="col-span-4 text-center text-muted-foreground py-8">
                      {repos.length === 0 ? "暂无仓库，请先同步数据" : "未找到匹配的仓库"}
                    </p>
                  )}
                </div>
              </div>
            )}
      </CardContent>
    </Card>
  );
}
