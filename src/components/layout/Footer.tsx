import { Link } from "@tanstack/react-router";
import { useSiteInfo } from "@/lib/site-info";
import { formatHours } from "@/lib/format";
import { ctaClass } from "@/lib/cta";
import { RautenPattern } from "@/components/RautenPattern";
import { BrandLogo } from "@/components/BrandLogo";

export function Footer() {
  const { name, company, contact, openingHours } = useSiteInfo();
  // Impresszum: whatever company details the admin has filled in.
  const impressum = [
    company.name && `Üzemeltető: ${company.name}`,
    company.address && `Székhely: ${company.address}`,
    company.regNumber && `Cégjegyzékszám: ${company.regNumber}`,
    company.taxNumber && `Adószám: ${company.taxNumber}`,
  ].filter(Boolean);

  return (
    <footer className="relative overflow-hidden border-t border-border bg-card pt-20">
      <RautenPattern />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo className="h-32" />
          <p className="mt-6 text-muted-foreground">
            Csapolt sör, szaftos burger és jó társaság Budapest szívében.
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-primary">
            Nyitvatartás
          </h2>
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
          <h2 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-primary">
            Kapcsolat
          </h2>
          <p className="text-sm">{contact.address}</p>
          <p className="mt-2 text-sm">{contact.phone}</p>
          <p className="mt-2 text-sm">{contact.email}</p>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-primary">
            Kövess minket
          </h2>
          <ul className="space-y-2 text-sm">
            {contact.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer" className="hover:text-primary">
                  {s.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <Link to="/foglalas" className={ctaClass("gold", "mt-2 px-5 py-3")}>
                Asztalfoglalás
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative mx-auto mt-16 flex max-w-7xl flex-wrap gap-x-6 gap-y-2 px-5 text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {name}. Minden jog fenntartva.
        </p>
        <Link to="/adatkezeles" className="underline underline-offset-4 hover:text-primary">
          Adatkezelési tájékoztató
        </Link>
        {impressum.length > 0 && <p className="basis-full">{impressum.join(" · ")}</p>}
      </div>
      <div
        aria-hidden
        className="relative -mb-[0.12em] mt-6 select-none text-center font-impact text-[27vw] leading-[0.78] text-primary"
      >
        Bajor
      </div>
    </footer>
  );
}
