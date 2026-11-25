"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { AlertCircle, Banknote, Building2, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { useStore } from "@/components/store/StoreContext";
import { useCart } from "./CartProvider";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/validations";
import { createOrder } from "@/lib/actions/checkout";
import { cn, formatPYG } from "@/lib/utils";
import type { WhatsAppOrderLine } from "@/lib/whatsapp";

export interface CheckoutSuccess {
  orderNumber: string;
  total: number;
  whatsappUrl: string;
  customerName: string;
  items: WhatsAppOrderLine[];
  popupBlocked: boolean;
}

const CUSTOMER_KEY = "ebm-customer-v1";

function loadCustomer(): Partial<CheckoutFormValues> {
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    return raw ? (JSON.parse(raw) as Partial<CheckoutFormValues>) : {};
  } catch {
    return {};
  }
}

export function CheckoutForm({ onSuccess, onBack }: { onSuccess: (s: CheckoutSuccess) => void; onBack: () => void }) {
  const { items, total, clear } = useCart();
  const { settings } = useStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const methods = settings.payment_methods.filter((p) => p.enabled);
  const saved = typeof window !== "undefined" ? loadCustomer() : {};

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: saved.customerName ?? "",
      customerPhone: saved.customerPhone ?? "",
      paymentMethod: methods.length === 1 ? methods[0].id : undefined,
      notes: "",
    },
  });

  const payment = watch("paymentMethod");

  const onSubmit = (values: CheckoutFormValues) => {
    setServerError(null);
    startTransition(async () => {
      const res = await createOrder({
        ...values,
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      });
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ customerName: values.customerName, customerPhone: values.customerPhone }));
      } catch {
        /* ignorar */
      }
      const win = window.open(res.whatsappUrl, "_blank");
      if (win) win.opener = null;
      clear();
      onSuccess({
        orderNumber: res.orderNumber,
        total: res.total,
        whatsappUrl: res.whatsappUrl,
        customerName: values.customerName,
        items: res.items,
        popupBlocked: !win,
      });
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 px-5 py-6">
      <div className="rounded-3xl bg-maleja-canvas p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-soft">
            {items.reduce((s, i) => s + i.quantity, 0)} prenda(s)
          </span>
          <span className="text-xl font-semibold tabular-nums">{formatPYG(total)}</span>
        </div>
        <button type="button" onClick={onBack} className="mt-1 text-xs font-medium text-maleja-deep underline-offset-4 hover:underline">
          Editar bolsa
        </button>
      </div>

      <div className="space-y-4">
        <p className="eyebrow">Tus datos</p>
        <Field label="Nombre completo" htmlFor="customerName" required error={errors.customerName?.message}>
          <Input
            id="customerName"
            autoComplete="name"
            placeholder="Ej.: María González"
            invalid={!!errors.customerName}
            {...register("customerName")}
          />
        </Field>
        <Field
          label="Teléfono / WhatsApp"
          htmlFor="customerPhone"
          required
          hint="Formato Paraguay: 0981 123 456"
          error={errors.customerPhone?.message}
        >
          <Input
            id="customerPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0981 123 456"
            invalid={!!errors.customerPhone}
            {...register("customerPhone")}
          />
        </Field>
      </div>

      <fieldset className="space-y-3" aria-describedby={errors.paymentMethod ? "payment-error" : undefined}>
        <legend className="eyebrow mb-3">
          Método de pago <span className="text-maleja-deep">*</span>
        </legend>
        <div className="grid gap-3">
          {methods.map((m) => {
            const active = payment === m.id;
            const Icon = m.id === "transferencia" ? Building2 : Banknote;
            return (
              <label
                key={m.id}
                className={cn(
                  "flex min-h-[60px] cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 text-left",
                  "transition-[background-color,border-color,box-shadow,transform] duration-200 ease-lux active:scale-[0.99]",
                  "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-maleja",
                  active ? "border-maleja bg-maleja-canvas ring-4 ring-maleja/10" : "border-maleja-pastel/60 bg-white hover:border-maleja-pastel"
                )}
              >
                <input type="radio" value={m.id} className="sr-only" {...register("paymentMethod")} />
                <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full", active ? "bg-maleja-deep text-white" : "bg-maleja-canvas text-maleja-deep")}>
                  <Icon className="size-5" strokeWidth={1.6} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-ink">{m.label}</span>
                  <span className="block whitespace-pre-line text-xs text-ink-soft">
                    {m.details || (m.id === "transferencia" ? "Te enviamos los datos bancarios por WhatsApp." : "Abonás al recibir o retirar tu pedido.")}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn("grid size-5 shrink-0 place-items-center rounded-full border transition-colors", active ? "border-maleja bg-maleja-deep text-white" : "border-ink/20")}
                >
                  {active && <Check className="size-3" strokeWidth={3} />}
                </span>
              </label>
            );
          })}
        </div>
        {errors.paymentMethod && (
          <p id="payment-error" role="alert" className="text-xs font-medium text-red-600">
            {errors.paymentMethod.message}
          </p>
        )}
      </fieldset>

      <Field label="Observaciones (opcional)" htmlFor="notes" hint="Dirección de entrega, horario preferido, consultas…" error={errors.notes?.message}>
        <Textarea id="notes" rows={3} placeholder="Ej.: Entrega en Asunción, barrio Villa Morra, después de las 17 h." {...register("notes")} />
      </Field>

      {serverError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="alert"
          className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{serverError}</span>
        </motion.div>
      )}

      <div className="space-y-3 pb-4">
        <Button type="submit" variant="whatsapp" size="lg" className="w-full" loading={pending}>
          {!pending && <WhatsAppIcon className="size-5" />}
          {pending ? "Registrando pedido…" : "Enviar pedido por WhatsApp"}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-soft">
          <Lock className="size-3" /> Verificamos precios y stock antes de registrar tu pedido.
        </p>
      </div>
    </form>
  );
}
