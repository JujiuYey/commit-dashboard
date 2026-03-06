import { createFileRoute } from "@tanstack/react-router";

import { ThemePage } from "@/pages/theme";

export const Route = createFileRoute("/_layout/theme")({
  component: ThemePage,
});
