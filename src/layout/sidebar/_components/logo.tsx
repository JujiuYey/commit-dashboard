import { SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="none" className={className}>
      <rect width="200" height="200" rx="40" className="fill-primary" />
      <g transform="translate(100,100) scale(6.667) translate(-12,-12)">
        <circle cx="18" cy="18" r="3" className="stroke-primary-foreground" strokeWidth="2" fill="none" />
        <circle cx="6" cy="6" r="3" className="stroke-primary-foreground" strokeWidth="2" fill="none" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" className="stroke-primary-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M11 18H8a2 2 0 0 1-2-2V9" className="stroke-primary-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}

export function Logo() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="data-[slot=sidebar-menu-button]:p-1.5!"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
              <LogoIcon className="size-8" />
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
