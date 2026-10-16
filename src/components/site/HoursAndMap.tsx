import { MapPin, Phone, Mail } from "lucide-react";
import { contact, openingHours } from "@/data/info";

export function MapPlaceholder() {
  return (
    <div className="relative h-full min-h-80 overflow-hidden rounded-3xl border border-border bg-card">
      <div className="rauten absolute inset-0 text-primary opacity-[0.07]" />
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-ember text-ember-foreground shadow-ember">
            <MapPin className="h-8 w-8" />
          </span>
          <p className="font-display text-3xl">Térkép helye</p>
          <p className="text-sm text-muted-foreground">{contact.address}</p>
        </div>
      </div>
    </div>
  );
}

export function HoursCard() {
  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <h3 className="mb-6 font-display text-4xl text-primary">Nyitvatartás</h3>
      <ul className="divide-y divide-border">
        {openingHours.map((h) => (
          <li key={h.day} className="flex justify-between py-3">
            <span className="text-muted-foreground">{h.day}</span>
            <span className="font-bold">{h.hours}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 space-y-3 text-sm">
        <p className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" />{contact.address}</p>
        <p className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" />{contact.phone}</p>
        <p className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" />{contact.email}</p>
      </div>
    </div>
  );
}
