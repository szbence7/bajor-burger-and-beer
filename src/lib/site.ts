/** Public origin used for canonical URLs, Open Graph and JSON-LD. Set VITE_SITE_URL at build time. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://bajorburgerandbeer.hu").replace(
  /\/+$/,
  "",
);

export const SITE_NAME = "Bajor Burger & Beer";

/** 1200×630 share image in /public. */
export const DEFAULT_OG_IMAGE = {
  path: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "A Bajor Burger & Beer saját Brutal Smashed burgere",
};

export const absoluteUrl = (path: string) => new URL(path, `${SITE_URL}/`).toString();
