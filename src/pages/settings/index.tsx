import { ConnectionInfo } from "./components/connection-info";
import { RepoSelector } from "./components/repo-selector";

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-bold">设置</h1>

      <ConnectionInfo />

      <RepoSelector />
    </div>
  );
}
