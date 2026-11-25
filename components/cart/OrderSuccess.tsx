"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import type { CheckoutSuccess } from "./CheckoutForm";
import { formatPYG } from "@/lib/utils";

export function OrderSuccess({ data, onClose }: { data: CheckoutSuccess; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
        className="relative grid h-24 w-24 place-items-center rounded-full bg-ok text-white shadow-[0_20px_50px_-15px_rgba(19,184,106,0.7)]"
      >
        <Check className="h-11 w-11" strokeWidth={2.4} />
        <span className="absolute inset-0 animate-ping rounded-full bg-ok/25 [animation-iteration-count:2]" />
      </motion.div>

      <p className="mt-8 eyebrow">Solicitud recibida</p>
      <h3 className="mt-2 font-serif text-4xl text-ink">¡Gracias, {data.customerName.split(" ")[0]}!</h3>

      <div className="mt-6 w-full rounded-3xl border border-maleja-pastel/50 bg-maleja-canvas p-5 text-left">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.18em] text-ink-soft">N° de pedido</span>
          <span className="font-sans text-lg font-semibold tracking-wide text-ink">{data.orderNumber}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.18em] text-ink-soft">Estado</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
            <Clock className="h-3 w-3" /> Pendiente de confirmación
          </span>
        </div>
        <ul className="mt-4 space-y-1.5 border-t border-maleja-pastel/40 pt-4 text-sm">
          {data.items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span className="min-w-0 truncate text-ink">
                {it.quantity}× {it.product_name} <span className="text-ink-soft">({it.size} · {it.color_name})</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatPYG(it.subtotal_pyg)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-maleja-pastel/40 pt-4">
          <span className="font-medium">Total</span>
          <span className="text-lg font-semibold tabular-nums">{formatPYG(data.total)}</span>
        </div>
      </div>

      <p className="mt-6 max-w-sm text-sm text-ink-soft">
        {data.popupBlocked
          ? "Tocá el botón para enviarnos el resumen por WhatsApp y confirmar disponibilidad y envío."
          : "Se abrió WhatsApp con el resumen de tu pedido. Si no se abrió, tocá el botón de abajo."}
      </p>

      <a href={data.whatsappUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles("whatsapp", "lg", "mt-5 w-full")}>
        <WhatsAppIcon className="h-5 w-5" /> Enviar por WhatsApp
      </a>
      <Link href="/tienda" onClick={onClose} className={buttonStyles("ghost", "md", "mt-2")}>
        Seguir comprando
      </Link>
    </div>
  );
}
