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
    <section className="relative overflow-hidden px-5 pb-16 pt-36 md:pt-44">
      <div className="rauten pointer-events-none absolute inset-y-0 right-0 w-1/3 text-primary opacity-[0.05]" />
      <Doodle kind="hop" className="right-[8%] top-32 h-24 w-24 rotate-12" />
      <Doodle kind="foam" className="bottom-6 left-[45%] h-24 w-24" />
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
        <h1 className="font-display text-7xl md:text-[10rem]">{title}</h1>
        {children && <p className="mt-6 max-w-xl text-lg text-muted-foreground">{children}</p>}
      </div>
    </section>
  );
}
