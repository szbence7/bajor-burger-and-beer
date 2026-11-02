import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { formatDateHu, todayInBudapest } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useAdminUser } from "./auth";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { accessToken, adminSupabase } from "./supabase";
import { ToastProvider, useToast } from "./ui";

const nav = [
  { to: "/admin", label: "Foglalások" },
  { to: "/admin/ajanlat", label: "Hónap ajánlata" },
  { to: "/admin/etlap", label: "Étlap PDF" },
  { to: "/admin/ertesitesek", label: "Értesítések" },
  { to: "/admin/adatok", label: "Adatok" },
  { to: "/admin/felhasznalok", label: "Felhasználók" },
] as const;

type LiveState = "connecting" | "live" | "offline";

const SOUND_KEY = "bajor-admin-sound";

/** Two short rising tones; needs a prior user gesture (the sound toggle) to be allowed. */
function chime(ctx: AudioContext) {
  [660, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + i * 0.18;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.17);
  });
}

/**
 * One Realtime channel for the whole panel: any reservation or notification change refreshes
 * the open lists, and a new booking pops a toast (plus a chime when enabled).
 */
function useLiveUpdates(soundOn: boolean, audio: RefObject<AudioContext | null>) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [state, setState] = useState<LiveState>("connecting");
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  useEffect(() => {
    const sb = adminSupabase();
    const refresh = (scope: string) =>
      void queryClient.invalidateQueries({ queryKey: ["admin", scope] });
    let channel: RealtimeChannel | undefined;
    let cancelled = false;

    const subscribe = () =>
      sb
        .channel("admin-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, (p) => {
          refresh("reservations");
          refresh("pending");
          if (p.eventType === "INSERT") {
            const r = p.new as { name?: string; date?: string; time?: string; party_size?: number };
            toast(
              `Új foglalás: ${r.name ?? ""}, ${r.date ? formatDateHu(r.date) : ""} ${r.time?.slice(0, 5) ?? ""}, ${r.party_size ?? ""} fő`,
            );
            if (soundRef.current && audio.current) chime(audio.current);
          }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "notification_log" }, () => {
          refresh("notifications");
          refresh("reservations");
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setState("live");
            // Catch up on anything missed while disconnected.
            refresh("reservations");
            refresh("pending");
            refresh("notifications");
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setState("offline");
          }
        });

    // supabase-js does not pass the two-factor (aal2) token on to Realtime after the code
    // check, and RLS only shows rows to aal2 admins, so hand it over before joining.
    void accessToken()
      .then((token) => sb.realtime.setAuth(token ?? null))
      .then(() => {
        if (!cancelled) channel = subscribe();
      });
    return () => {
      cancelled = true;
      if (channel) void sb.removeChannel(channel);
    };
  }, [queryClient, toast, audio]);

  return state;
}

function usePendingCount() {
  return useQuery({
    queryKey: ["admin", "pending"],
    queryFn: async () => {
      const { count, error } = await adminSupabase()
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .gte("date", todayInBudapest());
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function ShellInner({ children }: { children: ReactNode }) {
  const { email, signOut } = useAdminUser();
  const [soundOn, setSoundOn] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  useEffect(() => setSoundOn(localStorage.getItem(SOUND_KEY) === "1"), []);
  const live = useLiveUpdates(soundOn, audio);
  const pending = usePendingCount().data ?? 0;

  useEffect(() => {
    document.title = `${pending ? `(${pending}) ` : ""}Bajor admin`;
  }, [pending]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem(SOUND_KEY, next ? "1" : "0");
    if (next) {
      // Created on a click, so the browser lets it play later.
      audio.current ??= new AudioContext();
      void audio.current.resume();
      chime(audio.current);
    }
  };

  return (
    <div className="min-h-[100svh] pb-24">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/admin" className="flex items-center gap-2">
            <BrandLogo alt="" className="h-9" />
            <span className="font-display text-xl text-primary">Admin</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <span
              className="mr-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground"
              title={live === "live" ? "Élő kapcsolat" : "Nincs élő kapcsolat"}
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  live === "live" ? "bg-primary" : "border border-muted-foreground",
                )}
                aria-hidden
              />
              {live === "live" ? "Élő" : live === "connecting" ? "Kapcsolódás" : "Offline"}
            </span>
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={soundOn}
              aria-label={soundOn ? "Hangjelzés kikapcsolása" : "Hangjelzés bekapcsolása"}
              title="Hangjelzés új foglalásnál"
              className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:text-primary aria-pressed:text-primary"
            >
              {soundOn ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={signOut}
              aria-label="Kijelentkezés"
              title={`Kijelentkezés (${email})`}
              className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:text-primary"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
              activeProps={{ className: "bg-primary !text-primary-foreground" }}
            >
              {n.label}
              {n.to === "/admin" && pending > 0 && (
                <span
                  className="rounded-full bg-forest px-2 py-0.5 text-xs text-forest-foreground"
                  aria-label={`${pending} függőben`}
                >
                  {pending}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-6">{children}</main>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ShellInner>{children}</ShellInner>
    </ToastProvider>
  );
}
