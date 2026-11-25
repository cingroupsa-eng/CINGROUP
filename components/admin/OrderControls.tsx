"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { useToast } from "./Toast";
import { useConfirm } from "./ConfirmDialog";
import { saveOrderNotes, updateOrderStatus } from "@/lib/actions/admin";
import { ORDER_STATUSES } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STOCK_STATES: OrderStatus[] = ["confirmado", "preparando", "listo_entrega", "entregado"];

export function OrderStatusControl({ id, status, stockApplied }: { id: string; status: OrderStatus; stockApplied: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const confirm = useConfirm();

  const change = async (next: OrderStatus) => {
    if (next === status) return;
    if (next === "cancelado") {
      const ok = await confirm({
        title: "¿Cancelar este pedido?",
        description: stockApplied ? "Las prendas vuelven al inventario automáticamente." : "Podés reactivarlo más tarde si hace falta.",
        confirmLabel: "Cancelar pedido",
        cancelLabel: "Volver",
        destructive: true,
      });
      if (!ok) return;
    }
    setTarget(next);
    start(async () => {
      const r = await updateOrderStatus(id, next);
      setTarget(null);
      if (!r.ok) return toast("error", r.error);
      const willApply = !stockApplied && STOCK_STATES.includes(next);
      toast("success", willApply ? "Estado actualizado · stock descontado del inventario" : "Estado actualizado");
      router.refresh();
    });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ORDER_STATUSES.map((s) => {
          const active = s.id === status;
          return (
            <button
              key={s.id}
              type="button"
              disabled={pending}
              onClick={() => change(s.id)}
              className={cn(
                "flex min-h-[48px] items-center gap-2 rounded-2xl px-3 text-left text-sm font-medium ring-1 transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-lux",
                active ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-maleja-pastel/50 hover:ring-maleja",
                pending && !active && "opacity-60"
              )}
            >
              {target === s.id ? <Loader2 className="size-4 animate-spin" /> : active ? <Check className="size-4" /> : <span className={cn("size-2 rounded-full", s.dot)} />}
              {s.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        {stockApplied
          ? "✓ El stock de este pedido ya fue descontado. Si lo cancelás o volvés a «Pendiente», se repone automáticamente."
          : "Al pasar a «Confirmado» (o un estado posterior) se descuenta el stock automáticamente."}
      </p>
    </div>
  );
}

export function OrderNotes({ id, initial }: { id: string; initial: string }) {
  const toast = useToast();
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={4} placeholder="Notas internas: datos de envío, seña recibida, etc. (no las ve la clienta)" maxLength={2000} />
      <Button
        type="button"
        size="sm"
        variant="dark"
        loading={pending}
        disabled={value === initial}
        onClick={() =>
          start(async () => {
            const r = await saveOrderNotes(id, value);
            toast(r.ok ? "success" : "error", r.ok ? (r.message ?? "Guardado") : r.error);
          })
        }
      >
        Guardar notas
      </Button>
    </div>
  );
}
