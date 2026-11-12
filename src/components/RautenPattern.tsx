import { cn } from "@/lib/utils";

/** Bavarian diamond pattern filling its positioned parent. Footer and map card only. */
export function RautenPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "rauten pointer-events-none absolute inset-0 text-primary opacity-[0.04]",
        className,
      )}
    />
  );
}

/** Thin decorative diamond strip used as a divider between sections. */
export function RautenDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("px-5", className)}>
      <div className="rauten h-6 text-primary opacity-[0.12] [mask-repeat:repeat-x] [mask-size:16px_24px]" />
    </div>
  );
}
