import { createFileRoute } from "@tanstack/react-router";
import { SpecialsEditor } from "@/features/admin/SpecialsEditor";

export const Route = createFileRoute("/admin/ajanlat")({
  component: SpecialsEditor,
});
