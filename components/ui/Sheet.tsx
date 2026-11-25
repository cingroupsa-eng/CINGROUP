"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/** Panel deslizable (drawer) accesible: derecha, izquierda o inferior. */
export function Sheet({
  open,
  onClose,
  side = "right",
  title,
  children,
  footer,
  className,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  side?: "right" | "left" | "bottom";
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => panelRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  const variants = {
    right: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } },
    left: { initial: { x: "-100%" }, animate: { x: 0 }, exit: { x: "-100%" } },
    bottom: { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } },
  }[side];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" role="presentation">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            {...variants}
            transition={{ duration: 0.42, ease }}
            drag={side === "bottom" ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (side === "bottom" && (info.offset.y > 120 || info.velocity.y > 600)) onClose();
            }}
            className={cn(
              "absolute flex flex-col bg-white shadow-2xl outline-none",
              side === "right" && "inset-y-0 right-0 w-full max-w-[440px]",
              side === "left" && "inset-y-0 left-0 w-[86%] max-w-[360px]",
              side === "bottom" && "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[28px]",
              className
            )}
          >
            {side === "bottom" && (
              <div className="flex justify-center pt-3">
                <span className="h-1.5 w-12 rounded-full bg-ink/10" />
              </div>
            )}
            {title !== undefined && (
              <div className="flex items-center justify-between gap-4 border-b border-maleja-pastel/30 px-5 py-4">
                <div id={labelledBy} className="min-w-0 font-serif text-2xl text-ink">
                  {title}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition hover:bg-maleja-canvas hover:text-maleja"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
            {footer && (
              <div className="border-t border-maleja-pastel/30 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
