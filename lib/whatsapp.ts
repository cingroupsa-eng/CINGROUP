import { BRAND, PAYMENT_LABEL } from "./constants";
import { formatPYG, prettyPhone, waLink } from "./utils";

export interface WhatsAppOrderLine {
  product_name: string;
  size: string;
  color_name: string;
  quantity: number;
  unit_price_pyg: number;
  subtotal_pyg: number;
}

export interface WhatsAppOrder {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  notes?: string | null;
  total: number;
  items: WhatsAppOrderLine[];
  businessName?: string;
}

/** Mensaje estructurado para enviar el pedido a la tienda. */
export function buildOrderMessage(o: WhatsAppOrder): string {
  const lines: string[] = [];
  lines.push(`¡Hola! Quiero realizar este pedido en *${o.businessName || BRAND.name}* ✨`);
  lines.push("");
  lines.push(`🧾 *Pedido N° ${o.orderNumber}*`);
  lines.push(`👤 Nombre: ${o.customerName}`);
  lines.push(`📱 Teléfono: ${prettyPhone(o.customerPhone)}`);
  lines.push("");
  lines.push("🛍️ *Detalle de prendas:*");
  o.items.forEach((it, idx) => {
    lines.push(`${idx + 1}. ${it.product_name}`);
    lines.push(`   Talla: ${it.size} · Color: ${it.color_name} · Cant.: ${it.quantity}`);
    lines.push(`   ${formatPYG(it.unit_price_pyg)} c/u → Subtotal: ${formatPYG(it.subtotal_pyg)}`);
  });
  lines.push("");
  lines.push(`💰 *Total: ${formatPYG(o.total)}*`);
  lines.push(`💳 Método de pago: ${PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}`);
  if (o.notes?.trim()) lines.push(`📝 Observaciones: ${o.notes.trim()}`);
  lines.push("");
  lines.push("Quedo atenta a la confirmación de disponibilidad. ¡Gracias! 💕");
  return lines.join("\n");
}

export function buildOrderWhatsAppUrl(storePhone: string, o: WhatsAppOrder): string {
  return waLink(storePhone, buildOrderMessage(o));
}

/** Mensaje del admin a la clienta. */
export function buildCustomerMessage(customerName: string, orderNumber: string, statusLabel: string, businessName: string) {
  const first = customerName.split(" ")[0];
  return `¡Hola ${first}! Te escribimos de *${businessName}* 💕 sobre tu pedido *${orderNumber}*. Estado actual: *${statusLabel}*.`;
}
