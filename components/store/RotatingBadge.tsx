"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Insignia circular con texto que gira lentamente (se pausa fuera de pantalla). */
export function RotatingBadge({ text, className, center, id = "rb" }: { text: string; className?: string; center?: React.ReactNode; id?: string }) {
  const pathId = `circle-${id}`;
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("relative grid place-items-center", className)}>
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 size-full animate-spin-slow"
        style={{ animationPlayState: visible ? "running" : "paused" }}
        aria-hidden
      >
        <defs>
          <path id={pathId} d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text className="fill-current font-sans text-[10.5px] uppercase tracking-[0.32em]">
          <textPath href={`#${pathId}`}>{text}</textPath>
        </text>
      </svg>
      <div className="relative">{center}</div>
    </div>
  );
}
