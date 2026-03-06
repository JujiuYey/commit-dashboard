import { createFileRoute } from "@tanstack/react-router";

import { CommitsPage } from "@/pages/commits";

export const Route = createFileRoute("/_layout/commits")({
  component: CommitsPage,
});
