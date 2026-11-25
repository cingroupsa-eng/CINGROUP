"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { useDialogA11y } from "@/lib/hooks/useDialogA11y";
import { cn } from "@/lib/utils";

// Curva tipo iOS para paneles; la salida es más rápida que la entrada.
const DRAWER = [0.32, 0.72, 0, 1] as const;
const ENTER = { duration: 0.4, ease: DRAWER };
const EXIT = { duration: 0.22, ease: [0.4, 0, 1, 1] as const };

const offscreen = {
  right: "translateX(100%)",
  left: "translateX(-100%)",
} as const;

function SheetPanel({
  onClose,
  side,
  title,
  children,
  footer,
  className,
  labelledBy,
}: {
  onClose: () => void;
  side: "right" | "left" | "bottom";
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(true, panelRef, onClose);

  // Laterales: transform string (acelerado por GPU). Inferior: eje y para el gesto de arrastre.
  const motionProps =
    side === "bottom"
      ? {
          initial: { y: "100%" },
          animate: { y: 0, transition: ENTER },
          exit: { y: "100%", transition: EXIT },
          drag: "y" as const,
          dragConstraints: { top: 0, bottom: 0 },
          dragElastic: { top: 0.04, bottom: 0.6 },
          onDragEnd: (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
            // Un gesto rápido alcanza para cerrar, sin exigir distancia.
            if (info.offset.y > 120 || info.velocity.y > 500) onClose();
          },
        }
      : {
          initial: { transform: offscreen[side] },
          animate: { transform: "translateX(0%)", transition: ENTER },
          exit: { transform: offscreen[side], transition: EXIT },
        };

  return (
    <div className="fixed inset-0 z-overlay" role="presentation">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-ink/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }}
        exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title !== undefined ? labelledBy : undefined}
        data-dialog-panel=""
        {...motionProps}
        className={cn(
          "absolute flex flex-col bg-white shadow-2xl outline-none",
          side === "right" && "inset-y-0 right-0 w-full max-w-[440px]",
          side === "left" && "inset-y-0 left-0 w-[86%] max-w-[360px]",
          side === "bottom" && "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[28px]",
          className
        )}
      >
        {side === "bottom" && (
          <div className="flex justify-center pt-3" aria-hidden>
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
              className="grid size-11 shrink-0 place-items-center rounded-full text-ink transition-[background-color,color,transform] duration-press ease-lux hover:bg-maleja-canvas hover:text-maleja-deep active:scale-[0.95]"
            >
              <X className="size-5" />
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
  );
}

/** Panel deslizable (drawer) accesible: derecha, izquierda o inferior. */
export function Sheet({
  open,
  onClose,
  side = "right",
  title,
  children,
  footer,
  className,
  labelledBy = "sheet-title",
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
  return (
    <AnimatePresence>
      {open && (
        <SheetPanel onClose={onClose} side={side} title={title} footer={footer} className={className} labelledBy={labelledBy}>
          {children}
        </SheetPanel>
      )}
    </AnimatePresence>
  );
}
