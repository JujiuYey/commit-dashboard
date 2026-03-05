import {
  IconDashboard,
  IconGitCommit,
  IconGitPullRequest,
  IconPackages,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import * as React from "react";

import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";

import { Logo } from "./_components/logo";
import { NavMain } from "./_components/nav-main";
import { NavSecondary } from "./_components/nav-secondary";

const data = {
  navMain: [
    { title: "总览", url: "/", icon: IconDashboard },
    { title: "提交记录", url: "/commits", icon: IconGitCommit },
    { title: "成员贡献", url: "/members", icon: IconUsers },
    { title: "仓库对比", url: "/repos", icon: IconPackages },
    { title: "PR 统计", url: "/pulls", icon: IconGitPullRequest },
  ],
  navSecondary: [
    { title: "设置", url: "/settings", icon: IconSettings },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <Logo />
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <NavSecondary items={data.navSecondary} className="mt-auto" />
    </Sidebar>
  );
}
