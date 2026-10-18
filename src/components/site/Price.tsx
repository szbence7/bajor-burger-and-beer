import { formatNumber } from "@/data/info";
import { cn } from "@/lib/utils";

/** Price as "4 290 Ft"; keeps "Ft" mixed-case even inside uppercase display type. */
export function Price({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("whitespace-nowrap", className)}>
      {formatNumber(value)}
      <span className="normal-case">{" "}Ft</span>
    </span>
  );
}
