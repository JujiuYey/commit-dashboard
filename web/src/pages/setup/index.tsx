import { IconBrandGit, IconLoader2 } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { giteaAuthApi } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGiteaStore } from "@/stores/gitea";

export function SetupPage() {
  const navigate = useNavigate();
  const setConnection = useGiteaStore(s => s.setConnection);
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    if (!url || !token) {
      setError("请填写所有字段");
      return;
    }
    setLoading(true);
    setError("");

    const normalizedUrl = url.replace(/\/+$/, "");

    try {
      const user = await giteaAuthApi.verifyToken(normalizedUrl, token);
      setConnection(normalizedUrl, token, user);
      navigate({ to: "/" });
    }
    catch {
      setError("连接失败，请检查 URL 和 Token 是否正确");
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <IconBrandGit className="size-6" />
          </div>
          <CardTitle className="text-2xl">Gitea 提交分析面板</CardTitle>
          <CardDescription>
            连接你的 Gitea 实例，开始分析代码提交数据
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="gitea-url">Gitea 地址</Label>
            <Input
              id="gitea-url"
              placeholder="https://gitea.example.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="gitea-token">个人访问令牌</Label>
            <Input
              id="gitea-token"
              type="password"
              placeholder="your-access-token"
              value={token}
              onChange={e => setToken(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button onClick={handleConnect} disabled={loading} className="w-full">
            {loading && <IconLoader2 className="mr-2 size-4 animate-spin" />}
            连接
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
