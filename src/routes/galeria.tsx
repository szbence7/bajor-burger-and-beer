import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { GalleryGrid } from "@/features/gallery/GalleryGrid";
import { seo } from "@/lib/seo";
import { getGalleryContent } from "@/features/gallery/api";

export const Route = createFileRoute("/galeria")({
  head: () =>
    seo({
      path: "/galeria",
      title: "Galéria — Bajor Burger & Beer",
      description:
        "Nézz be hozzánk: esti hangulat, frissen sült burgerek, csapolt sörök és élőzenés estek a Bajor Burger & Beer-ben.",
    }),
  loader: () => getGalleryContent(),
  component: GalleryPage,
});

function GalleryPage() {
  const items = Route.useLoaderData();
  return (
    <>
      <PageHero
        eyebrow="Pillanatok"
        title={
          <>
            Galé<span className="text-primary">ria</span>
          </>
        }
      />
      <GalleryGrid items={items} />
    </>
  );
}
