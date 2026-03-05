import { createFileRoute } from "@tanstack/react-router";

import { PullsPage } from "@/pages/pulls";

export const Route = createFileRoute("/_layout/pulls")({
  component: PullsPage,
});
