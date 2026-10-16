import { Beer, Hamburger } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  words?: string[];
  tilt?: "left" | "right" | "none";
  variant?: "gold" | "dark";
  className?: string;
}

export function Marquee({
  words = ["Sör", "Burger", "Jó társaság"],
  tilt = "left",
  variant = "gold",
  className,
}: MarqueeProps) {
  const row = Array.from({ length: 6 }).flatMap((_, i) =>
    words.map((w, j) => ({ w, icon: (i + j) % 2 === 0 ? "burger" : "beer", key: `${i}-${j}` })),
  );
  return (
    <div
      className={cn(
        "relative z-10 -mx-4 overflow-hidden py-4",
        variant === "gold" ? "bg-primary text-primary-foreground" : "border-y border-primary/40 bg-card text-primary",
        tilt === "left" && "-rotate-3",
        tilt === "right" && "rotate-2",
        className,
      )}
    >
      <div className="flex w-max animate-marquee">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
            {row.map(({ w, icon, key }) => (
              <span key={key} className="flex items-center gap-6 px-6 font-display text-3xl md:text-5xl">
                {w}
                {icon === "burger" ? <Hamburger className="h-7 w-7 md:h-9 md:w-9" strokeWidth={2.5} /> : <Beer className="h-7 w-7 md:h-9 md:w-9" strokeWidth={2.5} />}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
