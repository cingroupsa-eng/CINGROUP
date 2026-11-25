import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { z } from "zod";
import { getAdminContext } from "@/lib/auth";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrderNotes, OrderStatusControl } from "@/components/admin/OrderControls";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { buttonStyles } from "@/components/ui/Button";
import { PAYMENT_LABEL, statusMeta } from "@/lib/constants";
import type { OrderItem, OrderWithItems, StoreSettings } from "@/lib/types";
import { formatDate, formatPYG, prettyPhone, waLink } from "@/lib/utils";
import { buildCustomerMessage } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Detalle de pedido" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const ctx = (await getAdminContext())!;
  const [{ data }, { data: settings }] = await Promise.all([
    ctx.supabase.from("orders").select("*, items:order_items(*)").eq("id", id).maybeSingle(),
    ctx.supabase.from("store_settings").select("business_name").eq("id", 1).maybeSingle(),
  ]);
  if (!data) notFound();
  const order = data as OrderWithItems;
  const items = (order.items ?? []) as OrderItem[];
  const businessName = (settings as Pick<StoreSettings, "business_name"> | null)?.business_name ?? "EL BAZAR DE MALEJA";
  const msg = buildCustomerMessage(order.customer_name, order.order_number, statusMeta(order.status).label, businessName);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/pedidos" aria-label="Volver" className="grid h-11 w-11 place-items-center rounded-full bg-white ring-1 ring-maleja-pastel/40 hover:text-maleja">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl">{order.order_number}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-ink-soft">Recibido el {formatDate(order.created_at)}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-3xl bg-white p-5 ring-1 ring-maleja-pastel/40 sm:p-6">
            <h2 className="font-serif text-2xl">Cambiar estado</h2>
            <div className="mt-4">
              <OrderStatusControl id={order.id} status={order.status} stockApplied={order.stock_applied} />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 ring-1 ring-maleja-pastel/40 sm:p-6">
            <h2 className="font-serif text-2xl">Prendas</h2>
            <ul className="mt-4 divide-y divide-maleja-pastel/30">
              {items.map((it) => (
                <li key={it.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {it.product_id ? (
                        <Link href={`/admin/productos/${it.product_id}`} className="hover:text-maleja">
                          {it.product_name}
                        </Link>
                      ) : (
                        it.product_name
                      )}
                    </p>
                    <p className="text-xs text-ink-soft">
                      Talla {it.size} · {it.color_name} · {it.quantity} × {formatPYG(it.unit_price_pyg)}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">{formatPYG(it.subtotal_pyg)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-baseline justify-between border-t border-maleja-pastel/40 pt-4">
              <span className="text-sm text-ink-soft">Total</span>
              <span className="text-2xl font-semibold tabular-nums">{formatPYG(order.total_pyg)}</span>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 ring-1 ring-maleja-pastel/40 sm:p-6">
            <h2 className="font-serif text-2xl">Notas internas</h2>
            <div className="mt-4">
              <OrderNotes id={order.id} initial={order.admin_notes ?? ""} />
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl bg-white p-5 ring-1 ring-maleja-pastel/40 sm:p-6">
            <h2 className="font-serif text-2xl">Clienta</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-ink-soft">Nombre</dt>
                <dd className="font-medium">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-ink-soft">Teléfono</dt>
                <dd className="font-medium">{prettyPhone(order.customer_phone)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-ink-soft">Método de pago</dt>
                <dd className="font-medium">{PAYMENT_LABEL[order.payment_method]}</dd>
              </div>
              {order.notes && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-ink-soft">Observaciones</dt>
                  <dd className="whitespace-pre-line rounded-2xl bg-maleja-canvas p-3">{order.notes}</dd>
                </div>
              )}
            </dl>
            <div className="mt-5 grid gap-2">
              <a href={waLink(order.customer_phone, msg)} target="_blank" rel="noopener noreferrer" className={buttonStyles("whatsapp", "md", "w-full")}>
                <WhatsAppIcon className="h-4 w-4" /> Escribir por WhatsApp
              </a>
              <a href={`tel:+${order.customer_phone}`} className={buttonStyles("outline", "md", "w-full")}>
                <Phone className="h-4 w-4" /> Llamar
              </a>
            </div>
          </section>
          <p className="px-2 text-xs text-ink-soft">Última actualización: {formatDate(order.updated_at)}</p>
        </aside>
      </div>
    </div>
  );
}
