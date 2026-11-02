import { createFileRoute } from "@tanstack/react-router";
import { UsersManager } from "@/features/admin/UsersManager";

export const Route = createFileRoute("/admin/felhasznalok")({
  component: UsersManager,
});
