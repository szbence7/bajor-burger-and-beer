import { cn } from "@/lib/utils";
import type { MenuBadge } from "@/data/menu";

const styles: Record<string, string> = {
  Új: "bg-forest text-forest-foreground",
  Csípős: "bg-forest text-forest-foreground",
  Vega: "bg-foreground text-background",
  "A ház kedvence": "bg-primary text-primary-foreground",
  csapolt: "bg-primary text-primary-foreground",
  palackos: "border border-primary text-primary",
};

export function Tag({ label, className }: { label: MenuBadge | string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider",
        styles[label] ?? "bg-muted text-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}
