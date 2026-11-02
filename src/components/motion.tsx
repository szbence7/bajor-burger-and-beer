// Shared motion: every appearing, disappearing or moving element eases instead of jumping.
// Motion (`m` components, lazily loaded features) for enter/exit and shared layout;
// AutoAnimate for lists. Both respect the visitor's reduced-motion setting.
import { AnimatePresence, LazyMotion, MotionConfig, m } from "motion/react";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";

export { AnimatePresence, m };

const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.35, ease: EASE }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

/** Content that appears and disappears: height and opacity ease in and out. */
export function Collapse({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <m.div
          key="collapse"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          style={{ overflow: "hidden" }}
          {...(className && { className })}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}

/** Cross-fades with a small slide whenever `id` changes (form steps, screens). */
export function Swap({
  id,
  children,
  className,
}: {
  id: string | number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: EASE }}
        {...(className && { className })}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
