import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, m } from "@/components/motion";
import { Link } from "@tanstack/react-router";
import { ctaClass } from "@/lib/cta";
import { useSiteInfo } from "@/lib/site-info";
import { budapestClock, openStatus } from "@/lib/opening-hours";

const DISMISSED_KEY = "bajor:booking-nudge";
const DELAY_MS = 10_000;
/** Saturday and Sunday (Monday = 0), Budapest time. */
const WEEKEND = [5, 6];

/**
 * A small "book now?" card on weekends while the restaurant is open (user request). It
 * comes up after a few seconds or once the visitor scrolls past the hero, never while the
 * booking form is on screen, and stays away for the rest of the visit once closed or used.
 * Not modal: the page stays usable behind it.
 */
export function BookingNudge() {
  const { openingHours } = useSiteInfo();
  const [eligible, setEligible] = useState(false);
  const [due, setDue] = useState(false);
  const [bookingInView, setBookingInView] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Decided in the browser only: it depends on the visitor's clock and session.
  useEffect(() => {
    const now = new Date();
    const weekend = WEEKEND.includes(budapestClock(now).day);
    const seen = sessionStorage.getItem(DISMISSED_KEY) === "1";
    setEligible(weekend && !seen && openStatus(openingHours, now).open);
  }, [openingHours]);

  useEffect(() => {
    if (!eligible) return;
    const timer = setTimeout(() => setDue(true), DELAY_MS);
    const onScroll = () => {
      if (window.scrollY > window.innerHeight) setDue(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const booking = document.getElementById("foglalas");
    const io = new IntersectionObserver(([e]) => setBookingInView(!!e?.isIntersecting));
    if (booking) io.observe(booking);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, [eligible]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  const open = eligible && due && !bookingInView && !dismissed;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="nudge"
          role="dialog"
          aria-labelledby="booking-nudge-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed inset-x-4 bottom-4 z-40 rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/60 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Bezárás"
            className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-colors hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
          <p id="booking-nudge-title" className="pr-10 font-display text-3xl">
            Servus!
          </p>
          <p className="mt-2 text-muted-foreground">
            Hétvége van, és most nyitva vagyunk. Foglalj asztalt, hogy biztosan legyen helyed.
          </p>
          <Link to="/" hash="foglalas" onClick={dismiss} className={ctaClass("gold", "mt-5")}>
            Asztalt foglalok
          </Link>
        </m.div>
      )}
    </AnimatePresence>
  );
}
