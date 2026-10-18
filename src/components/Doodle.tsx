import { cn } from "@/lib/utils";

export type DoodleKind = "burger" | "mug" | "foam" | "pretzel" | "fries" | "hop";

const paths: Record<DoodleKind, React.ReactNode> = {
  burger: (
    <>
      <path d="M10 38c0-14 12-24 30-24s30 10 30 24z" />
      <path d="M8 46c8 4 14-4 22 0s14-4 22 0 14-4 20 0" />
      <path d="M10 54h60" />
      <path d="M12 60c0 6 6 8 28 8s28-2 28-8z" />
      <path d="M28 24l2 2M40 20l1 2M52 24l-2 2" />
    </>
  ),
  mug: (
    <>
      <path d="M16 24h36v42c0 3-3 6-6 6H22c-3 0-6-3-6-6z" />
      <path d="M52 32h8c4 0 6 3 6 6v12c0 4-3 6-6 6h-8" />
      <path d="M14 24c-4-6 2-14 10-12 2-6 12-8 16-2 6-4 14 0 12 8" />
      <path d="M26 36v26M36 36v26M44 36v26" />
    </>
  ),
  foam: (
    <>
      <path d="M8 50c-6-10 4-22 14-16 2-12 18-14 22-4 8-8 24-2 20 10 10 0 12 14 2 16H12" />
      <circle cx="28" cy="20" r="3" />
      <circle cx="54" cy="14" r="2" />
    </>
  ),
  pretzel: (
    <>
      <path d="M40 66C20 66 10 54 12 40s16-22 28-10 18 26 4 30" />
      <path d="M40 66c20 0 30-12 28-26S52 18 40 30 22 56 36 60" />
      <path d="M30 22c4-8 16-8 20 0" />
    </>
  ),
  fries: (
    <>
      <path d="M18 34h44l-6 36H24z" />
      <path d="M24 34l-4-22M32 34l-1-26M40 34l1-24M48 34l3-22M56 34l6-18" />
      <path d="M30 50c4 4 16 4 20 0" />
    </>
  ),
  hop: (
    <>
      <path d="M40 10c12 8 18 22 14 38-2 10-8 18-14 22-6-4-12-12-14-22-4-16 2-30 14-38z" />
      <path d="M26 30c8 4 20 4 28 0M24 44c10 4 22 4 32 0M30 58c6 2 14 2 20 0" />
      <path d="M40 10c0-4 4-6 8-6" />
    </>
  ),
};

export function Doodle({ kind, className }: { kind: DoodleKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("pointer-events-none absolute h-20 w-20 text-primary opacity-10", className)}
    >
      {paths[kind]}
    </svg>
  );
}
