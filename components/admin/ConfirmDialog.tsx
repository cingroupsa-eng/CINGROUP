"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDialogA11y } from "@/lib/hooks/useDialogA11y";

interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type Pending = ConfirmOptions & { resolve: (v: boolean) => void };

const Ctx = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null);

function AlertDialogPanel({ pending, onDone }: { pending: Pending; onDone: (v: boolean) => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // El foco inicial va a "Cancelar": la opción segura en acciones irreversibles.
  useDialogA11y(true, panelRef, () => onDone(false), cancelRef);

  return (
    <div className="fixed inset-0 z-lightbox grid place-items-end p-4 sm:place-items-center" role="presentation">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-ink/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.2 } }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        onClick={() => onDone(false)}
      />
      <motion.div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={pending.description ? "confirm-desc" : undefined}
        tabIndex={-1}
        data-dialog-panel=""
        initial={{ opacity: 0, transform: "scale(0.96)" }}
        animate={{ opacity: 1, transform: "scale(1)", transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }}
        exit={{ opacity: 0, transform: "scale(0.98)", transition: { duration: 0.12 } }}
        className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl outline-none"
      >
        {pending.destructive && (
          <span aria-hidden className="mb-4 grid size-11 place-items-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="size-5" />
          </span>
        )}
        <h2 id="confirm-title" className="font-serif text-2xl text-ink">
          {pending.title}
        </h2>
        {pending.description && (
          <div id="confirm-desc" className="mt-2 text-sm text-ink-soft">
            {pending.description}
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} type="button" variant="outline" onClick={() => onDone(false)}>
            {pending.cancelLabel ?? "Cancelar"}
          </Button>
          <Button
            type="button"
            variant={pending.destructive ? "dark" : "primary"}
            className={pending.destructive ? "bg-red-600 hover:bg-red-700" : undefined}
            onClick={() => onDone(true)}
          >
            {pending.confirmLabel ?? "Confirmar"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (o: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...o, resolve })),
    []
  );

  const done = (v: boolean) => {
    pending?.resolve(v);
    setPending(null);
  };

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <AnimatePresence>{pending && <AlertDialogPanel key="confirm" pending={pending} onDone={done} />}</AnimatePresence>
    </Ctx.Provider>
  );
}

/** `const ok = await confirm({ title, description, destructive: true })` */
export function useConfirm() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useConfirm requiere <ConfirmProvider>");
  return v;
}
