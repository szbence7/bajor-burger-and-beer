import type { ImgHTMLAttributes } from "react";

/** Responsive image from vite-imagetools (`?…&as=picture`): one srcset per format. */
export interface PictureData {
  sources: Record<string, string>;
  img: { src: string; w: number; h: number };
}

/** Bundled, optimised asset or a plain URL (e.g. an image uploaded to Supabase Storage). */
export type ImageSource = PictureData | string;

type PictureProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
  image: ImageSource;
  alt: string;
  /** Rendered width hint for the browser, e.g. "(min-width: 768px) 33vw, 90vw". */
  sizes?: string;
};

export function Picture({ image, alt, sizes = "100vw", loading = "lazy", ...img }: PictureProps) {
  if (typeof image === "string") {
    return <img src={image} alt={alt} loading={loading} decoding="async" {...img} />;
  }
  return (
    <picture className="contents">
      {Object.entries(image.sources).map(([format, srcSet]) => (
        <source key={format} type={`image/${format}`} srcSet={srcSet} sizes={sizes} />
      ))}
      <img
        src={image.img.src}
        width={image.img.w}
        height={image.img.h}
        alt={alt}
        loading={loading}
        decoding="async"
        {...img}
      />
    </picture>
  );
}
