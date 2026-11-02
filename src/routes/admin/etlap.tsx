import { createFileRoute } from "@tanstack/react-router";
import { MenuPdfManager } from "@/features/admin/MenuPdfManager";

export const Route = createFileRoute("/admin/etlap")({
  component: MenuPdfManager,
});
