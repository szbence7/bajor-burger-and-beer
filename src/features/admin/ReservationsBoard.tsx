import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MessageSquare, Phone, RotateCw, Users } from "lucide-react";
import { z } from "zod";
import { addDays, formatDateHu, todayInBudapest } from "@/lib/date";
import { cn } from "@/lib/utils";
import { resendNotificationFn, setReservationStatusFn } from "./api";
import {
  ADMIN_ERRORS,
  decisionLabel,
  isReopening,
  NEXT_STATUSES,
  NOTIFICATION_KIND_LABELS,
  RESERVATION_STATUSES,
  STATUS_LABELS,
  reservationRow,
  type AdminResult,
  type DecisionOutcome,
  type DecisionStatus,
  type NotificationRow,
  type ReservationRow,
  type ReservationStatus,
} from "./schema";
import { adminSupabase } from "./supabase";
import {
  Button,
  Card,
  Chip,
  EmailStatus,
  PageTitle,
  StatusBadge,
  formatTimestamp,
  inputClass,
  labelClass,
  useToast,
} from "./ui";

const RANGES = [
  { id: "upcoming", label: "Közelgő" },
  { id: "today", label: "Ma" },
  { id: "tomorrow", label: "Holnap" },
  { id: "week", label: "7 nap" },
  { id: "past", label: "Korábbi" },
  { id: "day", label: "Nap…" },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

interface Filters {
  range: RangeId;
  day: string;
  status: ReservationStatus | "all";
}

function dateBounds(f: Filters, today: string): { from?: string; to?: string; desc?: boolean } {
  switch (f.range) {
    case "upcoming":
      return { from: today };
    case "today":
      return { from: today, to: today };
    case "tomorrow":
      return { from: addDays(today, 1), to: addDays(today, 1) };
    case "week":
      return { from: today, to: addDays(today, 6) };
    case "past":
      return { to: addDays(today, -1), desc: true };
    case "day":
      return { from: f.day, to: f.day };
  }
}

function useReservations(f: Filters, today: string) {
  return useQuery({
    queryKey: ["admin", "reservations", f, today],
    enabled: Boolean(today) && (f.range !== "day" || Boolean(f.day)),
    queryFn: async () => {
      const { from, to, desc = false } = dateBounds(f, today);
      let q = adminSupabase()
        .from("reservations")
        .select(
          "id, date, time, party_size, name, phone, email, note, status, decision_note, created_at, status_changed_at, notification_log (id, reservation_id, kind, recipient, status, error, created_at)",
        )
        .order("date", { ascending: !desc })
        .order("time", { ascending: !desc })
        .order("created_at", { referencedTable: "notification_log", ascending: true })
        .limit(500);
      if (from) q = q.gte("date", from);
      if (to) q = q.lte("date", to);
      if (f.status !== "all") q = q.eq("status", f.status);
      const { data, error } = await q;
      if (error) throw error;
      return z.array(reservationRow).parse(data);
    },
  });
}

const outcomeText: Record<DecisionOutcome["email"], string> = {
  sent: "a vendég e-mailt kapott.",
  failed: "de az e-mail küldése nem sikerült (lásd Értesítések).",
  skipped: "de e-mail nem ment ki: az e-mail-küldés nincs beállítva.",
};

const doneText: Record<DecisionStatus, string> = {
  confirmed: "Elfogadva",
  rejected: "Elutasítva",
  cancelled: "Lemondva",
};

function useResultToast() {
  const toast = useToast();
  return (result: AdminResult<DecisionOutcome>, done: string) => {
    if (!result.ok) {
      toast(ADMIN_ERRORS[result.error], "warning");
      return false;
    }
    toast(
      `${done}, ${outcomeText[result.data.email]}`,
      result.data.email === "sent" ? "info" : "warning",
    );
    return true;
  };
}

function EmailLog({ log }: { log: NotificationRow[] }) {
  const queryClient = useQueryClient();
  const report = useResultToast();
  const resend = useMutation({
    mutationFn: (id: string) => resendNotificationFn({ data: { id } }),
    onSuccess: (result) => {
      report(result, "Újraküldve");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
  if (log.length === 0) {
    return <p className="text-sm text-muted-foreground">Még nem ment ki értesítés.</p>;
  }
  return (
    <ul className="space-y-2">
      {log.map((n) => (
        <li key={n.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <EmailStatus status={n.status} />
          <span>{NOTIFICATION_KIND_LABELS[n.kind]}</span>
          <span className="text-muted-foreground">{formatTimestamp(n.created_at)}</span>
          {n.status !== "sent" && (
            <button
              type="button"
              disabled={resend.isPending}
              onClick={() => resend.mutate(n.id)}
              className="inline-flex items-center gap-1 font-bold text-primary underline underline-offset-4 disabled:opacity-40"
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden /> Újraküldés
            </button>
          )}
          {n.error && <span className="basis-full text-muted-foreground">{n.error}</span>}
        </li>
      ))}
    </ul>
  );
}

function Decision({
  reservation,
  status,
  onClose,
}: {
  reservation: ReservationRow;
  status: DecisionStatus;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const report = useResultToast();
  const decide = useMutation({
    mutationFn: () => setReservationStatusFn({ data: { id: reservation.id, status, message } }),
    onSuccess: (result) => {
      if (report(result, doneText[status])) onClose();
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => report({ ok: false, error: "unknown" }, ""),
  });
  const id = `decision-${reservation.id}`;
  const reopening = isReopening(reservation.status, status);
  // The seats may have been booked by someone else since the rejection.
  const overflow = useQuery({
    queryKey: ["admin", "overflow", reservation.id],
    enabled: reopening,
    queryFn: async () => {
      const { data, error } = await adminSupabase().rpc("capacity_overflow", {
        p_id: reservation.id,
      });
      if (error) throw error;
      return data as number;
    },
  });
  return (
    <div className="mt-4 rounded-2xl border-2 border-primary p-4">
      {reopening && (
        <div className="mb-4 space-y-2 text-sm">
          <p className="font-bold">
            Ezt a foglalást korábban{" "}
            {reservation.status === "rejected" ? "elutasítottátok" : "lemondtátok"}. A vendég erről
            már e-mailt kapott; most egy elfogadó e-mailt kap.
          </p>
          {overflow.data !== undefined &&
            (overflow.data > 0 ? (
              <p role="alert" className="rounded-xl border-2 border-primary-glow p-3 font-bold">
                Figyelem: közben betelt az időpont. Ha elfogadod, {overflow.data} fővel túllépitek a
                férőhelyet.
              </p>
            ) : (
              <p className="text-muted-foreground">Van még hely erre az időpontra.</p>
            ))}
        </div>
      )}
      <label htmlFor={id} className={labelClass}>
        Üzenet a vendégnek <span className="font-normal text-muted-foreground">(nem kötelező)</span>
      </label>
      <textarea
        id={id}
        rows={2}
        maxLength={500}
        className={inputClass}
        placeholder={
          status === "confirmed"
            ? "pl. A teraszon foglaltunk nektek helyet."
            : "pl. Erre az estére minden asztalunk foglalt."
        }
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant={status === "confirmed" ? "gold" : "outline"}
          disabled={decide.isPending}
          onClick={() => decide.mutate()}
        >
          {decide.isPending
            ? "Mentés…"
            : `${decisionLabel(reservation.status, status)} és értesítem`}
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={decide.isPending}>
          Mégse
        </Button>
      </div>
    </div>
  );
}

function ReservationCard({ r }: { r: ReservationRow }) {
  const [deciding, setDeciding] = useState<DecisionStatus | null>(null);
  return (
    <Card className={cn(r.status === "pending" && "border-2 border-primary")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-4xl text-primary">{r.time}</span>
          <span className="flex items-center gap-1.5 text-lg font-bold">
            <Users className="h-5 w-5 text-muted-foreground" aria-hidden />
            {r.party_size} fő
          </span>
        </div>
        <StatusBadge status={r.status} />
      </div>
      <p className="mt-2 break-words text-xl font-bold">{r.name}</p>
      <div className="mt-2 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-5">
        <a
          href={`tel:${r.phone.replace(/\s/g, "")}`}
          className="inline-flex items-center gap-2 py-1 font-bold text-primary"
        >
          <Phone className="h-4 w-4" aria-hidden /> {r.phone}
        </a>
        <a
          href={`mailto:${r.email}`}
          className="inline-flex min-w-0 items-center gap-2 py-1 text-primary [overflow-wrap:anywhere]"
        >
          <Mail className="h-4 w-4 shrink-0" aria-hidden /> {r.email}
        </a>
      </div>
      {r.note && (
        <p className="mt-3 flex gap-2 rounded-2xl bg-background p-3 text-sm">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="break-words">{r.note}</span>
        </p>
      )}
      {r.decision_note && (
        <p className="mt-3 text-sm text-muted-foreground">
          Üzenet a vendégnek: <span className="text-foreground">{r.decision_note}</span>
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Beérkezett: {formatTimestamp(r.created_at)}
        {r.status_changed_at &&
          ` · ${STATUS_LABELS[r.status]}: ${formatTimestamp(r.status_changed_at)}`}
      </p>

      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          E-mail értesítések
        </p>
        <EmailLog log={r.notification_log} />
      </div>

      {deciding ? (
        <Decision reservation={r} status={deciding} onClose={() => setDeciding(null)} />
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {NEXT_STATUSES[r.status].map((s) => (
            <Button
              key={s}
              // Undoing a rejection is the exception, so it is not the loud gold button.
              variant={s === "confirmed" && !isReopening(r.status, s) ? "gold" : "outline"}
              onClick={() => setDeciding(s)}
              className="flex-1 sm:flex-none"
            >
              {decisionLabel(r.status, s)}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}

export function ReservationsBoard() {
  const [today, setToday] = useState("");
  useEffect(() => setToday(todayInBudapest()), []);
  const [filters, setFilters] = useState<Filters>({ range: "upcoming", day: "", status: "all" });
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const query = useReservations(filters, today);
  const rows = query.data ?? [];

  const days = new Map<string, ReservationRow[]>();
  for (const r of rows) days.set(r.date, [...(days.get(r.date) ?? []), r]);

  return (
    <>
      <PageTitle>Foglalások</PageTitle>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {RANGES.map((r) => (
          <Chip key={r.id} selected={filters.range === r.id} onClick={() => set({ range: r.id })}>
            {r.label}
          </Chip>
        ))}
      </div>
      {filters.range === "day" && (
        <div className="mb-3 max-w-xs">
          <label htmlFor="admin-day" className="sr-only">
            Nap
          </label>
          <input
            id="admin-day"
            type="date"
            className={inputClass}
            value={filters.day}
            onChange={(e) => set({ day: e.target.value })}
          />
        </div>
      )}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <Chip selected={filters.status === "all"} onClick={() => set({ status: "all" })}>
          Mind
        </Chip>
        {RESERVATION_STATUSES.map((s) => (
          <Chip key={s} selected={filters.status === s} onClick={() => set({ status: s })}>
            {STATUS_LABELS[s]}
          </Chip>
        ))}
      </div>

      {query.isError ? (
        <Card>
          <p className="mb-3">Nem sikerült betölteni a foglalásokat.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Újrapróbálom
          </Button>
        </Card>
      ) : query.isPending ? (
        <p className="text-muted-foreground">
          {filters.range === "day" && !filters.day ? "Válassz napot." : "Betöltés…"}
        </p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-muted-foreground">Nincs foglalás ezekkel a szűrőkkel.</p>
        </Card>
      ) : (
        <div className="space-y-10">
          {[...days].map(([date, list]) => {
            const guests = list
              .filter((r) => r.status === "pending" || r.status === "confirmed")
              .reduce((sum, r) => sum + r.party_size, 0);
            return (
              <section key={date} aria-labelledby={`day-${date}`}>
                <h2
                  id={`day-${date}`}
                  className="sticky top-[7.5rem] z-10 -mx-4 mb-3 bg-background/95 px-4 py-2 font-display text-2xl backdrop-blur"
                >
                  {date === today ? "Ma — " : ""}
                  {formatDateHu(date)}
                  <span className="ml-3 font-sans text-sm font-bold normal-case tracking-normal text-muted-foreground">
                    {list.length} foglalás · {guests} fő várható
                  </span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {list.map((r) => (
                    <ReservationCard key={r.id} r={r} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
