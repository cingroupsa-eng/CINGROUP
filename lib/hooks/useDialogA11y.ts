"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let lockCount = 0;
let prevOverflow = "";

/**
 * Comportamiento accesible de diálogo:
 * - atrapa el foco (Tab / Shift+Tab) dentro del panel
 * - Escape cierra
 * - bloquea el scroll del body (con contador, soporta diálogos anidados)
 * - devuelve el foco al disparador al cerrar
 */
export function useDialogA11y(open: boolean, ref: RefObject<HTMLElement | null>, onClose: () => void, initialFocus?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;

    if (lockCount++ === 0) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    const raf = requestAnimationFrame(() => {
      const target = initialFocus?.current ?? ref.current;
      target?.focus({ preventScroll: true });
    });

    const onKey = (e: KeyboardEvent) => {
      const panel = ref.current;
      if (!panel) return;
      // Sólo el diálogo superior responde.
      if (!panel.contains(document.activeElement) && document.activeElement !== document.body) {
        const top = Array.from(document.querySelectorAll<HTMLElement>("[data-dialog-panel]")).pop();
        if (top && top !== panel) return;
      }
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      if (--lockCount === 0) document.body.style.overflow = prevOverflow;
      if (trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
    };
    // onClose se lee en cada evento; no reiniciamos el efecto por su identidad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
