import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { GalleryGrid } from "@/features/gallery/GalleryGrid";

export const Route = createFileRoute("/galeria")({
  head: () => ({
    meta: [
      { title: "Galéria — Bajor Burger & Beer" },
      {
        name: "description",
        content: "Képek a helyről, ételeinkről, söreinkről és eseményeinkről.",
      },
      { property: "og:title", content: "Galéria — Bajor Burger & Beer" },
      {
        property: "og:description",
        content: "Nézz be hozzánk: hangulat, burgerek, sörök és élőzene.",
      },
    ],
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
