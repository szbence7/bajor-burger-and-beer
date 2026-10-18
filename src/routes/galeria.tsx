import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { GalleryGrid } from "@/features/gallery/GalleryGrid";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/galeria")({
  head: () =>
    seo({
      path: "/galeria",
      title: "Galéria — Bajor Burger & Beer",
      description:
        "Nézz be hozzánk: esti hangulat, frissen sült burgerek, csapolt sörök és élőzenés estek a Bajor Burger & Beer-ben.",
    }),
  component: GalleryPage,
});

function GalleryPage() {
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
      <GalleryGrid />
    </>
  );
}
