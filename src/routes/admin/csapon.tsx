import { createFileRoute } from "@tanstack/react-router";
import { TapsEditor } from "@/features/admin/TapsEditor";

export const Route = createFileRoute("/admin/csapon")({
  component: TapsEditor,
});
