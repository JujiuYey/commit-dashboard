import logo from "@/assets/logo.svg";
import { SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function Logo() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="data-[slot=sidebar-menu-button]:p-1.5!"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
              <img src={logo} alt="logo" className="size-8" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">提交分析面板</span>
              <span className="truncate text-xs">Gitea 数据分析</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
