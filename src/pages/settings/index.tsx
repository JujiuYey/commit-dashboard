import { IconCheck, IconLoader2, IconTrash } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useUserRepos } from "@/hooks/use-repos";
import { useGiteaStore } from "@/stores/gitea";
import type { RepoIdentifier } from "@/types/gitea";

export function SettingsPage() {
  const navigate = useNavigate();
  const { baseUrl, currentUser, selectedRepos, setSelectedRepos, clearConnection } = useGiteaStore();
  const { data: repos, loading } = useUserRepos();
  const [localSelected, setLocalSelected] = useState<RepoIdentifier[]>(selectedRepos);

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

  const handleDisconnect = () => {
    clearConnection();
    navigate({ to: "/setup" });
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-bold">设置</h1>

      <Card>
        <CardHeader>
          <CardTitle>连接信息</CardTitle>
          <CardDescription>当前 Gitea 连接详情</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">地址：</span>
            <span className="font-mono">{baseUrl}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">用户：</span>
            <span>{currentUser?.full_name || currentUser?.login}</span>
            <Badge variant="outline">{currentUser?.login}</Badge>
          </div>
          <Button variant="destructive" size="sm" className="w-fit" onClick={handleDisconnect}>
            <IconTrash className="mr-1 size-4" />
            断开连接
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>仓库选择</CardTitle>
              <CardDescription>选择需要分析的仓库</CardDescription>
            </div>
            <Button onClick={handleSave} size="sm">
              <IconCheck className="mr-1 size-4" />
              保存选择
            </Button>
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
                <div className="grid gap-2">
                  {repos.map(repo => (
                    <label
                      key={repo.id}
                      className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={isSelected(repo.owner.login, repo.name)}
                        onCheckedChange={() => toggleRepo(repo.owner.login, repo.name)}
                      />
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="font-medium text-sm truncate">{repo.full_name}</span>
                        {repo.description && (
                          <span className="text-xs text-muted-foreground truncate">{repo.description}</span>
                        )}
                      </div>
                      {repo.language && (
                        <Badge variant="secondary" className="shrink-0">{repo.language}</Badge>
                      )}
                    </label>
                  ))}
                  {repos.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">未找到仓库</p>
                  )}
                </div>
              )}
        </CardContent>
      </Card>
    </div>
  );
}
