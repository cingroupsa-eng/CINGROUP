"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button, buttonStyles } from "@/components/ui/Button";
import { useStore } from "@/components/store/StoreContext";
import { useCart } from "./CartProvider";
import { CheckoutForm, type CheckoutSuccess } from "./CheckoutForm";
import { OrderSuccess } from "./OrderSuccess";
import { formatPYG } from "@/lib/utils";

type Step = "cart" | "checkout" | "success";

export function CartDrawer() {
  const { isOpen, close, items, total, count, setQty, remove } = useCart();
  const { settings } = useStore();
  const [step, setStep] = useState<Step>("cart");
  const [success, setSuccess] = useState<CheckoutSuccess | null>(null);

  const onClose = () => {
    close();
    if (step === "checkout") setStep("cart");
    if (step === "success") {
      setTimeout(() => {
        setStep("cart");
        setSuccess(null);
      }, 400);
    }
  };

  const whatsappReady = Boolean(settings.whatsapp_number);

  const title =
    step === "cart" ? (
      <span className="flex items-baseline gap-2">
        Tu bolsa <span className="font-sans text-sm text-ink-soft">({count})</span>
      </span>
    ) : step === "checkout" ? (
      <button type="button" onClick={() => setStep("cart")} className="flex min-h-[44px] items-center gap-2 text-left">
        <ArrowLeft className="size-5" /> Finalizar pedido
      </button>
    ) : (
      "¡Pedido registrado!"
    );

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      side="right"
      title={title}
      labelledBy="cart-title"
      footer={
        step === "cart" && items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-soft">Total estimado</span>
              <span className="font-sans text-2xl font-semibold tabular-nums text-ink">{formatPYG(total)}</span>
            </div>
            <p className="text-xs text-ink-soft">El costo de envío se coordina por WhatsApp al confirmar tu pedido.</p>
            {whatsappReady ? (
              <Button size="lg" className="w-full" onClick={() => setStep("checkout")}>
                Continuar con el pedido
              </Button>
            ) : (
              <div className="rounded-2xl bg-maleja-canvas p-4 text-center text-sm text-ink-soft">
                <p className="font-medium text-ink">Pedidos online muy pronto ✨</p>
                <p className="mt-1">Estamos configurando nuestro canal de WhatsApp. Volvé en unas horas para enviar tu pedido.</p>
              </div>
            )}
          </div>
        ) : null
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === "cart" && (
          <motion.div
            key="cart"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {items.length === 0 ? (
              <div className="flex flex-col items-center px-8 py-20 text-center">
                <div className="relative grid size-24 place-items-center rounded-full bg-maleja-canvas">
                  <ShoppingBag className="size-10 text-maleja" strokeWidth={1.3} />
                  <span className="absolute -right-1 top-2 size-3 animate-floaty rounded-full bg-maleja-pastel" />
                </div>
                <p className="mt-6 font-serif text-3xl text-ink">Tu bolsa está vacía</p>
                <p className="mt-2 max-w-xs text-sm text-ink-soft">Descubrí prendas pensadas para resaltar tu esencia.</p>
                <Link href="/tienda" onClick={onClose} className={buttonStyles("dark", "md", "mt-8")}>
                  Explorar la tienda
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-maleja-pastel/30 px-5">
                <AnimatePresence initial={false}>
                  {items.map((it) => (
                    <motion.li
                      key={it.key}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0, transition: { duration: 0.25 } }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-4 py-5">
                        <Link
                          href={`/producto/${it.slug}`}
                          onClick={onClose}
                          className="relative h-[120px] w-[92px] shrink-0 overflow-hidden rounded-2xl bg-maleja-canvas"
                        >
                          {it.image ? (
                            <Image src={it.image} alt={it.name} fill sizes="92px" className="object-cover" />
                          ) : (
                            <span className="grid h-full place-items-center font-serif text-3xl italic text-maleja-pastel">M</span>
                          )}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/producto/${it.slug}`} onClick={onClose} className="font-serif text-lg leading-tight text-ink hover:text-maleja">
                              {it.name}
                            </Link>
                            <button
                              type="button"
                              onClick={() => remove(it.key)}
                              aria-label={`Quitar ${it.name}`}
                              className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-maleja-canvas hover:text-maleja"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="size-3 rounded-full ring-1 ring-ink/10" style={{ backgroundColor: it.colorHex }} />
                              {it.colorName}
                            </span>
                            <span>Talla {it.size}</span>
                          </div>
                          <div className="mt-auto flex items-end justify-between pt-3">
                            <div className="flex items-center rounded-full border border-maleja-pastel/60">
                              <button
                                type="button"
                                onClick={() => setQty(it.key, it.quantity - 1)}
                                aria-label="Restar uno"
                                className="grid size-10 place-items-center rounded-full text-ink transition hover:text-maleja"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-medium tabular-nums">{it.quantity}</span>
                              <button
                                type="button"
                                onClick={() => setQty(it.key, it.quantity + 1)}
                                disabled={it.quantity >= it.maxStock}
                                aria-label="Sumar uno"
                                className="grid size-10 place-items-center rounded-full text-ink transition hover:text-maleja disabled:opacity-30"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-[15px] font-semibold tabular-nums text-ink">{formatPYG(it.unitPrice * it.quantity)}</p>
                              {it.quantity > 1 && <p className="text-[11px] text-ink-soft">{formatPYG(it.unitPrice)} c/u</p>}
                            </div>
                          </div>
                          {it.quantity >= it.maxStock && (
                            <p className="mt-2 text-[11px] text-maleja">Máximo disponible: {it.maxStock}</p>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </motion.div>
        )}

        {step === "checkout" && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <CheckoutForm
              onSuccess={(s) => {
                setSuccess(s);
                setStep("success");
              }}
              onBack={() => setStep("cart")}
            />
          </motion.div>
        )}

        {step === "success" && success && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <OrderSuccess data={success} onClose={onClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
