import { createFileRoute } from "@tanstack/react-router";
import { SiteDetailsEditor } from "@/features/admin/SiteDetailsEditor";

export const Route = createFileRoute("/admin/adatok")({
  component: SiteDetailsEditor,
});
