// Admin panel primitives: the site's tokens and type, calmer and denser for phones.
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { AlertTriangle, Check, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_STATUS_LABELS,
  STATUS_LABELS,
  type NotificationStatus,
  type ReservationStatus,
} from "./schema";

const buttonVariants = {
  gold: "bg-primary text-primary-foreground hover:bg-primary-glow",
  forest: "bg-forest text-forest-foreground hover:brightness-110",
  outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
  ghost: "border-2 border-border text-foreground hover:border-primary",
};

export function Button({
  variant = "gold",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export const inputClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none [color-scheme:dark] focus:border-primary aria-[invalid=true]:border-primary-glow";
export const labelClass = "mb-2 block text-sm font-bold";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-3xl border border-border bg-card p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

export function PageTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-display text-4xl sm:text-5xl">{children}</h1>
      {aside}
    </div>
  );
}

/** Pill filters (status, date range). */
export function Chip({
  selected,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

const statusStyles: Record<ReservationStatus, string> = {
  pending: "bg-primary text-primary-foreground",
  confirmed: "bg-forest text-forest-foreground",
  rejected: "border border-border text-muted-foreground",
  cancelled: "border border-border text-muted-foreground",
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider",
        statusStyles[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function EmailStatus({ status }: { status: NotificationStatus }) {
  const Icon = status === "sent" ? Check : status === "failed" ? AlertTriangle : MinusCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-bold",
        status === "sent" && "text-foreground",
        status === "failed" && "text-primary-glow",
        status === "skipped" && "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", status === "sent" && "text-primary")} aria-hidden />
      {NOTIFICATION_STATUS_LABELS[status]}
    </span>
  );
}

/** "nov. 2. 14:03" in Budapest time. */
export const formatTimestamp = (iso: string) =>
  new Date(iso).toLocaleString("hu-HU", {
    timeZone: "Europe/Budapest",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Toasts ----------------------------------------------------------------------------------------

interface Toast {
  id: number;
  message: string;
  tone: "info" | "warning";
}

const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[110] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <p
            key={t.id}
            className={cn(
              "pointer-events-auto w-full max-w-md rounded-2xl px-5 py-3 font-bold shadow-gold",
              t.tone === "info"
                ? "bg-primary text-primary-foreground"
                : "border-2 border-primary-glow bg-card text-foreground",
            )}
          >
            {t.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
