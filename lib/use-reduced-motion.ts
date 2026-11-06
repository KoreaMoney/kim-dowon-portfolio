"use client";

import { useReducedMotion as useMotionReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// The server has no media query, so SSR always renders the animated variant.
// Reporting "not reduced" through hydration keeps the client tree identical to
// the HTML; the real preference lands on the next render, so reduced-motion
// users still get final states with no animation — just without a hydration
// mismatch throwing away the whole tree.
export function useReducedMotion(): boolean {
  const reduced = useMotionReducedMotion() ?? false;
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  return hydrated && reduced;
}
