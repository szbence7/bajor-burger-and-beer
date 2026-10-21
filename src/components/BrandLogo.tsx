import { cn } from "@/lib/utils";

/**
 * The restaurant's official logo (B² with "Burger & Beer"), traced to `public/logo.svg` from
 * `docs/brand/logo-original.png`. It is fixed: never recolour, crop or redraw it. Size it by
 * height; the width follows the aspect ratio.
 */
export function BrandLogo({
  className,
  alt = "Bajor Burger & Beer logó",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src="/logo.svg"
      alt={alt}
      width={662}
      height={784}
      decoding="async"
      className={cn("h-14 w-auto", className)}
    />
  );
}
