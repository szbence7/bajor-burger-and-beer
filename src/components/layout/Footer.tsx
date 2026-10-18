import { Link } from "@tanstack/react-router";
import { contact, openingHours } from "@/data/info";
import { formatHours } from "@/lib/format";
import { RautenPattern } from "@/components/RautenPattern";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-card pt-20">
      <RautenPattern />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-3xl text-primary">Bajor Burger &amp; Beer</p>
          <p className="mt-4 text-muted-foreground">
            Csapolt sör, szaftos burger és jó társaság Budapest szívében.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-primary">
            Nyitvatartás
          </h4>
          <ul className="space-y-1 text-sm">
            {openingHours.map((h) => (
              <li key={h.label} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{h.label}</span>
                <span>{formatHours(h)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-primary">
            Kapcsolat
          </h4>
          <p className="text-sm">{contact.address}</p>
          <p className="mt-2 text-sm">{contact.phone}</p>
          <p className="mt-2 text-sm">{contact.email}</p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-primary">
            Kövess minket
          </h4>
          <ul className="space-y-2 text-sm">
            {contact.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer" className="hover:text-primary">
                  {s.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <Link to="/foglalas" className="font-bold text-ember hover:underline">
                Asztalfoglalás →
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="relative mx-auto mt-16 max-w-7xl px-5 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Bajor Burger &amp; Beer. Minden jog fenntartva.
      </p>
      <div
        aria-hidden
        className="relative -mb-[0.12em] mt-6 select-none text-center font-display text-[27vw] leading-[0.78] text-primary"
      >
        Bajor
      </div>
    </footer>
  );
}
