import { useEffect, useState } from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import { ctaClass } from "@/lib/cta";
import { useSiteInfo } from "@/lib/site-info";
import { formatHours } from "@/lib/format";
import { RautenPattern } from "./RautenPattern";

const MAP_CONSENT_KEY = "bajor-map-consent";

/**
 * Google Maps of the address set in admin → Adatok. The iframe loads only after a click
 * (it sends the visitor's data to Google and sets cookies, and it is heavy); once accepted,
 * later visits show it straight away. The directions link works without loading anything.
 */
export function MapCard() {
  const { contact } = useSiteInfo();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (localStorage.getItem(MAP_CONSENT_KEY) === "1") setShow(true);
  }, []);
  const query = encodeURIComponent(contact.address);
  const load = () => {
    localStorage.setItem(MAP_CONSENT_KEY, "1");
    setShow(true);
  };

  return (
    <div className="relative h-full min-h-80 overflow-hidden rounded-3xl border border-border bg-card">
      {show ? (
        <iframe
          title={`Térkép: ${contact.address}`}
          src={`https://www.google.com/maps?q=${query}&output=embed&hl=hu`}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <>
          <RautenPattern className="opacity-[0.05]" />
          <div className="relative grid h-full min-h-80 place-items-center p-6 text-center">
            <div>
              <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-gold">
                <MapPin className="h-8 w-8" />
              </span>
              <p className="font-display text-3xl">Itt találsz minket</p>
              <p className="text-sm text-muted-foreground">{contact.address}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={load} className={ctaClass("gold", "px-5 py-3")}>
                  Térkép megjelenítése
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${query}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ctaClass("outline", "px-5 py-3")}
                >
                  Útvonaltervezés
                </a>
              </div>
              <p className="mx-auto mt-4 max-w-xs text-xs text-muted-foreground">
                A térkép a Google Maps-ről töltődik be; ehhez adatok jutnak el a Google-höz.
              </p>
            </div>
          </div>
        </>
      )}
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
