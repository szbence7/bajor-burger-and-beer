import type { SiteInfo } from "@/data/info";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, absoluteUrl } from "./site";

/** schema.org Restaurant for the root <head>; built from the same data the pages show. */
export function restaurantJsonLd({ contact, openingHours }: SiteInfo) {
  const { street, postalCode, city, country } = contact.addressParts;
  // Only real profile URLs belong in sameAs, not bare network homepages.
  const sameAs = contact.socials
    .map((s) => s.href)
    .filter((href) => new URL(href).pathname !== "/");

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${SITE_URL}/#restaurant`,
    name: SITE_NAME,
    url: SITE_URL,
    image: absoluteUrl(DEFAULT_OG_IMAGE.path),
    telephone: contact.phone,
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: street,
      postalCode,
      addressLocality: city,
      addressCountry: country,
    },
    servesCuisine: ["Burger", "Bajor", "Kézműves sör"],
    priceRange: "$$",
    hasMenu: absoluteUrl("/menu"),
    acceptsReservations: absoluteUrl("/foglalas"),
    openingHoursSpecification: openingHours
      .filter((h) => h.opens && h.closes)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.days,
        opens: h.opens,
        closes: h.closes,
      })),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

/** JSON for an inline <script>; escapes "<" so content can never close the tag. */
export const toJsonLdScript = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
