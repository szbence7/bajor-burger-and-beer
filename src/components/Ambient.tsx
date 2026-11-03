import { cn } from "@/lib/utils";

/**
 * A faint pool of warm light at one side of a dark section, like the venue's lamps, so
 * sections without a doodle don't feel flat. A blurred circle rather than a gradient box, so
 * it fades out on every side and never leaves a seam at a section edge (`main` clips the
 * sideways overflow). The section needs `relative isolate`; the glow sits behind its content.
 */
export function Ambient({ side, className }: { side: "left" | "right"; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-1/2 -z-10 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]",
        side === "left" ? "-left-40" : "-right-40",
        className,
      )}
    />
  );
}
