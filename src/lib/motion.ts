import { useAutoAnimate } from "@formkit/auto-animate/react";

/** The site's easing: quick start, soft landing. */
export const EASE = [0.2, 0.8, 0.2, 1] as const;

/** Ref for a list container: added, removed and reordered children animate (AutoAnimate). */
export function useSmoothList<T extends HTMLElement>() {
  const [ref] = useAutoAnimate<T>({ duration: 280, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
  return ref;
}
