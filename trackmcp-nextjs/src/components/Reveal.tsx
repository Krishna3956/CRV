"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  y = 20,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "span" | "li";
}) {
  const MotionTag = motion[as];
  const reduce = useReducedMotion();

  // Reduced motion: render in place, no entrance transform or stagger.
  if (reduce) {
    return <MotionTag className={className}>{children}</MotionTag>;
  }

  return (
    <MotionTag
      className={className}
      // Keep content visible before the client observer is ready. An
      // entrance animation must never turn a server-rendered page into a
      // blank screen on a slow device or a browser that delays observers.
      initial={{ opacity: 1, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 0.5, 0.15, 1] }}
    >
      {children}
    </MotionTag>
  );
}
