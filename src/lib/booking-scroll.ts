import type { MouseEvent } from "react";

/** Repeated booking links keep working when the URL already contains the same hash. */
export function scrollToBooking(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  if (event.currentTarget.hash !== "#foglalas") return;
  if (window.location.pathname !== "/" || window.location.hash !== "#foglalas") return;
  event.preventDefault();
  requestAnimationFrame(() => document.getElementById("foglalas")?.scrollIntoView());
}
