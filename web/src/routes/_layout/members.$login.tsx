import { createFileRoute } from "@tanstack/react-router";

import { MemberDetailPage } from "@/pages/members/detail";

export const Route = createFileRoute("/_layout/members/$login")({
  component: MemberDetailPage,
});
