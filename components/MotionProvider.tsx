"use client";

import { MotionConfig } from "framer-motion";

/** Respeta "reducir movimiento" del sistema también en animaciones de Framer Motion. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
