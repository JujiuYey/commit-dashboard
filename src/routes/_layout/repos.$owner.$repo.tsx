import { createFileRoute } from "@tanstack/react-router";

import { RepoDetailPage } from "@/pages/repos/detail";

export const Route = createFileRoute("/_layout/repos/$owner/$repo")({
  component: RepoDetailPage,
});
