import { DEFAULT_OG_IMAGE, absoluteUrl } from "./site";

interface SeoInput {
  title: string;
  description: string;
  /** Route path, e.g. "/menu"; becomes the canonical and og:url. */
  path: string;
}

/** Per-route head tags: title, description, canonical, Open Graph and Twitter card. */
export function seo({ title, description, path }: SeoInput) {
  const url = absoluteUrl(path);
  const image = absoluteUrl(DEFAULT_OG_IMAGE.path);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:width", content: String(DEFAULT_OG_IMAGE.width) },
      { property: "og:image:height", content: String(DEFAULT_OG_IMAGE.height) },
      { property: "og:image:alt", content: DEFAULT_OG_IMAGE.alt },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
