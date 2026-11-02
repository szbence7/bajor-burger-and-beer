import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCw } from "lucide-react";
import { z } from "zod";
import { formatDateHu } from "@/lib/date";
import { resendNotificationFn } from "./api";
import {
  ADMIN_ERRORS,
  NOTIFICATION_KIND_LABELS,
  NOTIFICATION_STATUS_LABELS,
  notificationRow,
} from "./schema";
import { adminSupabase } from "./supabase";
import { Button, Card, Chip, EmailStatus, PageTitle, formatTimestamp, useToast } from "./ui";

const logRow = notificationRow.extend({
  reservations: z.object({ name: z.string(), date: z.string(), time: z.string() }).nullable(),
});

function useLog(onlyProblems: boolean) {
  return useQuery({
    queryKey: ["admin", "notifications", onlyProblems],
    queryFn: async () => {
      let q = adminSupabase()
        .from("notification_log")
        .select(
          "id, reservation_id, kind, recipient, status, error, created_at, reservations (name, date, time)",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (onlyProblems) q = q.neq("status", "sent");
      const { data, error } = await q;
      if (error) throw error;
      return z.array(logRow).parse(data);
    },
  });
}

/** Every email the site tried to send, newest first, with its outcome. */
export function NotificationLog() {
  const [onlyProblems, setOnlyProblems] = useState(false);
  const query = useLog(onlyProblems);
  const queryClient = useQueryClient();
  const toast = useToast();
  const resend = useMutation({
    mutationFn: (id: string) => resendNotificationFn({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) toast(ADMIN_ERRORS[result.error], "warning");
      else
        toast(
          `Újraküldés: ${NOTIFICATION_STATUS_LABELS[result.data.email].toLowerCase()}.`,
          result.data.email === "sent" ? "info" : "warning",
        );
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast(ADMIN_ERRORS.unknown, "warning"),
  });
  const rows = query.data ?? [];

  return (
    <>
      <PageTitle>Értesítések</PageTitle>
      <p className="mb-4 max-w-2xl text-muted-foreground">
        Minden e-mail, amit az oldal a foglalásokról kiküldött vagy megpróbált kiküldeni. Az új
        bejegyzések maguktól megjelennek.
      </p>
      <div className="mb-6 flex gap-2">
        <Chip selected={!onlyProblems} onClick={() => setOnlyProblems(false)}>
          Mind
        </Chip>
        <Chip selected={onlyProblems} onClick={() => setOnlyProblems(true)}>
          Csak a ki nem ment
        </Chip>
      </div>

      {query.isError ? (
        <Card>
          <p className="mb-3">Nem sikerült betölteni a naplót.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Újrapróbálom
          </Button>
        </Card>
      ) : query.isPending ? (
        <p className="text-muted-foreground">Betöltés…</p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-muted-foreground">
            {onlyProblems ? "Minden e-mail kiment." : "Még nem ment ki értesítés."}
          </p>
        </Card>
      ) : (
        <ul className="divide-y divide-border rounded-3xl border border-border bg-card">
          {rows.map((n) => (
            <li key={n.id} className="flex flex-col gap-1 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <EmailStatus status={n.status} />
                <span className="text-sm text-muted-foreground">
                  {formatTimestamp(n.created_at)}
                </span>
              </div>
              <p className="font-bold">{NOTIFICATION_KIND_LABELS[n.kind]}</p>
              <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
                Címzett: {n.recipient}
                {n.reservations &&
                  ` · ${n.reservations.name}, ${formatDateHu(n.reservations.date)} ${n.reservations.time.slice(0, 5)}`}
              </p>
              {n.error && <p className="text-sm text-primary-glow">{n.error}</p>}
              {n.status !== "sent" && n.reservation_id && (
                <button
                  type="button"
                  disabled={resend.isPending}
                  onClick={() => resend.mutate(n.id)}
                  className="mt-1 inline-flex w-fit items-center gap-1 py-1 text-sm font-bold text-primary underline underline-offset-4 disabled:opacity-40"
                >
                  <RotateCw className="h-3.5 w-3.5" aria-hidden /> Újraküldés
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
