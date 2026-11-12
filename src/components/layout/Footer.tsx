import { scrollToBooking } from "@/lib/booking-scroll";
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
          <p className="font-display text-2xl text-foreground">{name}</p>
          <p className="mt-3 text-muted-foreground">Bajor sörház, smash burgerrel.</p>
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
              <Link
                to="/"
                onClick={scrollToBooking}
                hash="foglalas"
                className={ctaClass("gold", "mt-2 px-5 py-3")}
              >
                Asztalfoglalás
              </Link>
            </li>
          </ul>
        </div>
      </div>
      {/* The whole logo, large: the footer's signature (it is never cropped or redrawn). */}
      <div className="relative mt-16 flex justify-center px-5">
        <BrandLogo className="h-48 md:h-64" />
      </div>
      <div className="relative mx-auto mt-12 flex max-w-7xl flex-wrap justify-center gap-x-6 gap-y-2 px-5 pb-10 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {name}
        </p>
        <Link to="/adatkezeles" className="underline underline-offset-4 hover:text-primary">
          Adatkezelési tájékoztató
        </Link>
        {impressum.length > 0 && <p className="basis-full">{impressum.join(" · ")}</p>}
      </div>
    </footer>
  );
}
