"use server";

import { getPublicSupabase } from "@/lib/supabase/server";
import { checkoutPayloadSchema, type CheckoutPayload } from "@/lib/validations";
import { normalizeParaguayPhone } from "@/lib/utils";
import { buildOrderWhatsAppUrl, type WhatsAppOrderLine } from "@/lib/whatsapp";
import { getSettings } from "@/lib/data";

export type CheckoutResult =
  | {
      ok: true;
      orderNumber: string;
      total: number;
      whatsappUrl: string;
      items: WhatsAppOrderLine[];
    }
  | { ok: false; error: string; code?: string; fieldErrors?: Record<string, string[] | undefined> };

function translateError(message: string): { error: string; code: string } {
  if (message.includes("WHATSAPP_NOT_CONFIGURED"))
    return { code: "WHATSAPP_NOT_CONFIGURED", error: "La tienda todavía está configurando su WhatsApp. Probá de nuevo en unas horas 💕" };
  if (message.includes("EMPTY_CART")) return { code: "EMPTY_CART", error: "Tu bolsa está vacía." };
  if (message.includes("TOO_MANY_ITEMS")) return { code: "TOO_MANY_ITEMS", error: "Tu pedido tiene demasiados artículos distintos." };
  if (message.includes("INVALID_PAYMENT_METHOD"))
    return { code: "INVALID_PAYMENT_METHOD", error: "El método de pago elegido no está disponible." };
  if (message.includes("RATE_LIMITED"))
    return {
      code: "RATE_LIMITED",
      error: "Ya recibimos varias solicitudes desde este número. Escribinos por WhatsApp y te ayudamos enseguida.",
    };
  if (message.includes("ITEM_UNAVAILABLE"))
    return { code: "ITEM_UNAVAILABLE", error: "Una de las prendas de tu bolsa ya no está disponible. Revisá tu bolsa e intentá de nuevo." };
  if (message.includes("INVALID_QUANTITY")) return { code: "INVALID_QUANTITY", error: "Revisá las cantidades de tu bolsa." };
  if (message.includes("INSUFFICIENT_STOCK")) {
    const detail = message.split("INSUFFICIENT_STOCK:")[1]?.trim();
    return {
      code: "INSUFFICIENT_STOCK",
      error: `No hay stock suficiente${detail ? ` de ${detail}` : ""}. Ajustá la cantidad e intentá de nuevo.`,
    };
  }
  return { code: "UNKNOWN", error: "No pudimos registrar tu pedido. Intentá nuevamente en unos segundos." };
}

/**
 * Crea la solicitud de pedido. La validación autoritativa (precios reales,
 * disponibilidad, stock, método de pago) ocurre en la función SQL
 * `create_order` dentro de una única transacción.
 */
export async function createOrder(input: CheckoutPayload): Promise<CheckoutResult> {
  const parsed = checkoutPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const sb = getPublicSupabase();
  if (!sb) {
    return { ok: false, code: "NOT_CONFIGURED", error: "La tienda todavía no está conectada a su base de datos." };
  }

  const settings = await getSettings();
  if (!settings.whatsapp_number) {
    return { ok: false, ...translateError("WHATSAPP_NOT_CONFIGURED") };
  }

  const data = parsed.data;
  const phone = normalizeParaguayPhone(data.customerPhone)!;

  // Agrupa variantes repetidas.
  const merged = new Map<string, number>();
  for (const it of data.items) merged.set(it.variantId, (merged.get(it.variantId) ?? 0) + it.quantity);

  const { data: result, error } = await sb.rpc("create_order", {
    p_customer_name: data.customerName,
    p_customer_phone: phone,
    p_payment_method: data.paymentMethod,
    p_notes: data.notes ?? "",
    p_items: Array.from(merged, ([variant_id, quantity]) => ({ variant_id, quantity })),
  });

  if (error || !result) {
    if (process.env.NODE_ENV !== "production") console.error("[createOrder]", error);
    return { ok: false, ...translateError(error?.message ?? "") };
  }

  const r = result as {
    order_number: string;
    total_pyg: number;
    items: WhatsAppOrderLine[];
    whatsapp_number: string;
  };

  const whatsappUrl = buildOrderWhatsAppUrl(r.whatsapp_number, {
    orderNumber: r.order_number,
    customerName: data.customerName,
    customerPhone: phone,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
    total: Number(r.total_pyg),
    items: r.items,
    businessName: settings.business_name,
  });

  return { ok: true, orderNumber: r.order_number, total: Number(r.total_pyg), whatsappUrl, items: r.items };
}
