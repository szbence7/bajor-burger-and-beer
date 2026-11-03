import { useId } from "react";
import type { Tap } from "@/data/taps";
import { Picture } from "@/components/Picture";

/**
 * Most csapon: a row of gold beer taps, one per beer on tap, each with the beer's round logo
 * on top of its handle. The taps hang from one continuous rail; on narrow screens the row
 * wraps and every line gets its own rail. Hovering a tap pulls its handle.
 */
export function TapRow({ taps }: { taps: Tap[] }) {
  // Gradient ids are document-wide; keep them unique per instance.
  const id = useId().replace(/:/g, "");
  const metal = `tap-metal-${id}`;
  return (
    <>
      <svg aria-hidden className="absolute h-0 w-0">
        <defs>
          {/* Brushed gold, lit from the left: a cylinder seen from the front. */}
          <linearGradient id={metal} x1="0" x2="1" y1="0" y2="0">
            <stop
              offset="0"
              style={{ stopColor: "color-mix(in oklab, var(--primary) 55%, black)" }}
            />
            <stop offset="0.3" style={{ stopColor: "var(--primary-glow)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--primary)" }} />
            <stop
              offset="1"
              style={{ stopColor: "color-mix(in oklab, var(--primary) 50%, black)" }}
            />
          </linearGradient>
        </defs>
      </svg>
      <ul className="flex flex-wrap justify-center gap-y-12">
        {taps.map((tap) => (
          <li
            key={tap.id}
            title={tap.name}
            className="group flex w-20 flex-col items-center sm:w-24 md:w-28 lg:w-32"
          >
            {/* Logo + handle tilt together around the point where the handle meets the rail. */}
            <div className="flex w-full origin-bottom flex-col items-center px-1.5 transition-transform duration-500 ease-out group-hover:-rotate-[8deg] motion-reduce:transition-none sm:px-2">
              <div className="relative aspect-square w-full overflow-hidden rounded-full border-[3px] border-primary bg-card shadow-gold">
                <Picture
                  image={tap.logo}
                  alt={tap.name}
                  sizes="(min-width: 1024px) 112px, (min-width: 768px) 96px, 72px"
                  className="h-full w-full object-cover"
                />
              </div>
              <svg viewBox="0 0 40 72" className="-mt-0.5 w-[34%]" aria-hidden>
                {/* Tapering handle, then the lever collar sitting on the rail. */}
                <path d="M11 0h18l-4 58H15z" fill={`url(#${metal})`} />
                <rect x="9" y="56" width="22" height="16" rx="4" fill={`url(#${metal})`} />
              </svg>
            </div>
            {/* The rail: opaque rounded segments that overlap their neighbours, so they merge
                into one bar and every wrapped line still ends in rounded caps. */}
            <div className="h-3.5 w-[calc(100%+1rem)] rounded-full bg-linear-to-b from-primary-glow via-primary to-[color-mix(in_oklab,var(--primary)_55%,black)] sm:h-4" />
            <svg viewBox="0 0 40 64" className="w-[34%]" aria-hidden>
              {/* Shank, faucet body and the spout. */}
              <rect x="15" y="0" width="10" height="10" fill={`url(#${metal})`} />
              <rect x="7" y="9" width="26" height="22" rx="6" fill={`url(#${metal})`} />
              <path d="M14 30h12l-2 30a4 4 0 0 1-8 0z" fill={`url(#${metal})`} />
            </svg>
          </li>
        ))}
      </ul>
    </>
  );
}
