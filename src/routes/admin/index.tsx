import { createFileRoute } from "@tanstack/react-router";
import { ReservationsBoard } from "@/features/admin/ReservationsBoard";

export const Route = createFileRoute("/admin/")({
  component: ReservationsBoard,
});
