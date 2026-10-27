"use client";

import { motion, useReducedMotion } from "motion/react";

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return <motion.div className="route-surface" initial={reduced ? false : { opacity: .98, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? .01 : .18, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}
