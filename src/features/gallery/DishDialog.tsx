import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Picture } from "@/components/Picture";
import type { DishPhoto } from "@/data/images";

/**
 * A dish from the photo carousel: its name in the menu's script, the photo, and what is in it.
 * Native `<dialog>` (focus trap, Escape, focus back to the photo); `.dish-dialog` in styles.css
 * eases it in and out.
 */
export function DishDialog({ dish, onClose }: { dish: DishPhoto | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Keep the last dish on screen while the dialog fades out.
  const [shown, setShown] = useState(dish);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (dish) {
      setShown(dish);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [dish]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // A click on the dialog element itself is a click on the backdrop around the card.
      onClick={(event) => event.target === event.currentTarget && ref.current?.close()}
      className="dish-dialog m-auto outline-none max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-border bg-card p-0 text-foreground shadow-2xl"
    >
      {shown && (
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="pt-1 font-script text-4xl text-primary sm:text-5xl">
              {shown.alt}
            </h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Bezárás"
            >
              <X className="h-7 w-7" />
            </button>
          </div>
          <Picture
            image={shown.src}
            alt={shown.alt}
            loading="eager"
            sizes="(min-width: 640px) 32rem, 100vw"
            className="mt-4 aspect-[3/2] w-full rounded-2xl object-cover"
          />
          <p className="mt-5 text-lg text-foreground/85">{shown.description}</p>
        </div>
      )}
    </dialog>
  );
}
