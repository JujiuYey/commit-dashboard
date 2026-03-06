import { IconTrash } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGiteaStore } from "@/stores/gitea";

export function ConnectionInfo() {
  const navigate = useNavigate();
  const { baseUrl, currentUser, clearConnection } = useGiteaStore();

  const handleDisconnect = () => {
    clearConnection();
    navigate({ to: "/setup" });
  };

  return (
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
  );
}
