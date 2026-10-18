import type { ReactNode } from "react";
import { Doodle } from "./Doodle";

export function PageHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-32 md:pt-44">
      <div className="glow-gold pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] opacity-25" />
      <Doodle kind="hop" className="right-[6%] top-28 h-40 w-40 rotate-12 md:h-56 md:w-56" />
      <Doodle kind="foam" className="bottom-4 left-[45%] hidden h-36 w-36 md:block" />
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
        <h1 className="font-display text-[clamp(3.5rem,16vw,10rem)]">{title}</h1>
        {children && <p className="mt-6 max-w-xl text-lg text-muted-foreground">{children}</p>}
      </div>
    </section>
  );
}
