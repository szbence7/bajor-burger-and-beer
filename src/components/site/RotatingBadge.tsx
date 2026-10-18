import { Hamburger } from "lucide-react";
import { cn } from "@/lib/utils";

export function RotatingBadge({
  text = "KÉZMŰVES SÖR • FRISS HÚS • BUDAPEST • ",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative grid h-36 w-36 place-items-center rounded-full bg-ember text-ember-foreground shadow-ember",
        className,
      )}
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full animate-spin-slow">
        <defs>
          <path id="circ" d="M100,100 m-75,0 a75,75 0 1,1 150,0 a75,75 0 1,1 -150,0" />
        </defs>
        <text
          fill="currentColor"
          style={{ fontFamily: "var(--font-display)", fontSize: 21, letterSpacing: 3 }}
        >
          <textPath href="#circ">{text}</textPath>
        </text>
      </svg>
      <Hamburger className="h-10 w-10" strokeWidth={2.4} />
    </div>
  );
}
