import { createFileRoute, redirect } from "@tanstack/react-router";

import { LayoutComponent } from "@/layout/index";
import { useGiteaStore } from "@/stores/gitea";

export const Route = createFileRoute("/_layout")({
  beforeLoad: () => {
    const { baseUrl, token, currentUser } = useGiteaStore.getState();
    if (!baseUrl || !token || !currentUser) {
      throw redirect({ to: "/setup" });
    }
  },
  component: LayoutComponent,
});
