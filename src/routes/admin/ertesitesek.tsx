import { createFileRoute } from "@tanstack/react-router";
import { NotificationLog } from "@/features/admin/NotificationLog";

export const Route = createFileRoute("/admin/ertesitesek")({
  component: NotificationLog,
});
