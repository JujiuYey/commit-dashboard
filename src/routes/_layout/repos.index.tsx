import { createFileRoute } from "@tanstack/react-router";

import { ReposPage } from "@/pages/repos";

export const Route = createFileRoute("/_layout/repos/")({
  component: ReposPage,
});
