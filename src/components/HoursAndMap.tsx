import { useState } from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import { siApple, siGooglemaps, siWaze, type SimpleIcon } from "simple-icons";
import { ctaClass } from "@/lib/cta";
import { cn } from "@/lib/utils";
import { useSiteInfo } from "@/lib/site-info";
import { formatHours } from "@/lib/format";
import { RautenPattern } from "./RautenPattern";

/**
 * Google Maps of the address set in admin → Adatok. It shows straight away (lazily, once the
 * section nears the screen); the privacy notice says that it sends data to Google. Until the
 * map has loaded, the card shows the address, so nothing jumps.
 */
export function MapCard({ className }: { className?: string }) {
  const { contact } = useSiteInfo();
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={cn(
        "relative min-h-80 overflow-hidden rounded-3xl border border-border bg-card",
        className,
      )}
    >
      <RautenPattern className="opacity-[0.05]" />
      <div className="absolute inset-0 grid place-items-center p-6 text-center">
        <div>
          <MapPin className="mx-auto mb-3 h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">{contact.address}</p>
        </div>
      </div>
      <iframe
        title={`Térkép: ${contact.address}`}
        src={`https://www.google.com/maps?q=${encodeURIComponent(contact.address)}&output=embed&hl=hu`}
        onLoad={() => setLoaded(true)}
        className={cn(
          "absolute inset-0 h-full w-full border-0 transition-opacity duration-700 motion-reduce:transition-none",
          loaded ? "opacity-100" : "opacity-0",
        )}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}

/** Each app's "navigate to" link; on phones they open the app with the venue as destination. */
const NAV_APPS: { name: string; icon: SimpleIcon; href: (q: string) => string }[] = [
  {
    name: "Google Maps",
    icon: siGooglemaps,
    href: (q) => `https://www.google.com/maps/dir/?api=1&destination=${q}`,
  },
  { name: "Apple Térképek", icon: siApple, href: (q) => `https://maps.apple.com/?daddr=${q}` },
  { name: "Waze", icon: siWaze, href: (q) => `https://waze.com/ul?q=${q}&navigate=yes` },
];

function BrandIcon({ icon }: { icon: SimpleIcon }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 fill-current">
      <path d={icon.path} />
    </svg>
  );
}

/** "Vigyél oda:" — directions to the admin-set address in Google Maps, Apple Maps or Waze. */
export function DirectionsLinks({ className }: { className?: string }) {
  const { contact } = useSiteInfo();
  const q = encodeURIComponent(contact.address);
  return (
    <div className={className}>
      <p className="mb-3 font-display text-2xl">Vigyél oda:</p>
      <ul className="flex flex-wrap gap-3">
        {NAV_APPS.map((app) => (
          <li key={app.name}>
            <a
              href={app.href(q)}
              target="_blank"
              rel="noopener noreferrer"
              className={ctaClass("outline", "gap-2.5 px-5 py-3")}
            >
              <BrandIcon icon={app.icon} />
              {app.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HoursCard() {
  const { contact, openingHours } = useSiteInfo();

  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <h3 className="mb-6 font-display text-4xl text-primary">Nyitvatartás</h3>
      <ul className="divide-y divide-border">
        {openingHours.map((h) => (
          <li key={h.label} className="flex justify-between py-3">
            <span className="text-muted-foreground">{h.label}</span>
            <span className="font-bold">{formatHours(h)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 space-y-3 text-sm">
        <p className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-primary" />
          {contact.address}
        </p>
        <p className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-primary" />
          {contact.phone}
        </p>
        <p className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-primary" />
          {contact.email}
        </p>
      </div>
    </div>
  );
}
