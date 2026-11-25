import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Plus } from "lucide-react";
import { getAdminContext } from "@/lib/auth";
import { OrderTag } from "@/components/brand/OrderTag";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { buttonStyles } from "@/components/ui/Button";
import { PAYMENT_LABEL } from "@/lib/constants";
import type { Order, StoreSettings } from "@/lib/types";
import { cn, formatPYG, timeAgo, waLink } from "@/lib/utils";
import { buildCustomerMessage } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Inicio" };

type QueueOrder = Order & { items: { quantity: number }[] };
type LowStock = { id: string; size: string; color_name: string; stock: number; product: { id: string; name: string } | null };

export default async function DashboardPage() {
  const ctx = (await getAdminContext())!;
  const sb = ctx.supabase;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [queueRes, pendingCount, published, totalProducts, lowStockRes, settingsRes, catCount, monthRes] = await Promise.all([
    sb.from("orders").select("*, items:order_items(quantity)").eq("status", "pendiente").order("created_at", { ascending: true }).limit(6),
    sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
    sb.from("products").select("id", { count: "exact", head: true }).eq("is_published", true),
    sb.from("products").select("id", { count: "exact", head: true }),
    sb.from("product_variants").select("id, size, color_name, stock, product:products(id, name)").lte("stock", 2).order("stock").limit(6),
    sb.from("store_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
    sb.from("orders").select("total_pyg").in("status", ["confirmado", "preparando", "listo_entrega", "entregado"]).gte("created_at", monthStart),
  ]);

  const settings = settingsRes.data as StoreSettings | null;
  const queue = (queueRes.data ?? []) as QueueOrder[];
  const lowStock = (lowStockRes.data ?? []) as unknown as LowStock[];
  const pending = pendingCount.count ?? 0;
  const monthTotal = (monthRes.data ?? []).reduce((s, o) => s + ((o.total_pyg as number) ?? 0), 0);
  const businessName = settings?.business_name ?? "EL BAZAR DE MALEJA";

  const setup = [
    { done: Boolean(settings?.whatsapp_number), label: "Número de WhatsApp de la tienda", critical: true, href: "/admin/configuracion" },
    { done: (catCount.count ?? 0) > 0, label: "Categorías activas", href: "/admin/categorias" },
    { done: (published.count ?? 0) > 0, label: "Primera prenda publicada", href: "/admin/productos/nuevo" },
    { done: Boolean(settings?.hero_image_url), label: "Foto principal de la portada", href: "/admin/configuracion" },
    { done: Boolean(settings?.instagram_url || settings?.facebook_url || settings?.tiktok_url), label: "Redes sociales", href: "/admin/configuracion" },
    { done: Boolean(settings?.business_hours && settings?.address), label: "Horarios y dirección", href: "/admin/configuracion" },
    { done: Boolean(settings?.delivery_info), label: "Información de entregas", href: "/admin/configuracion" },
  ];
  const doneCount = setup.filter((s) => s.done).length;
  const whatsappMissing = !settings?.whatsapp_number;
  const firstName = ctx.profile?.full_name?.split(" ")[0];
  const today = new Intl.DateTimeFormat("es-PY", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Asuncion" }).format(new Date());

  return (
    <div className="mx-auto max-w-5xl">
      {/* Encabezado: saludo + resumen en una línea (no tarjetas de métricas) */}
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium capitalize text-ink-soft">{today}</p>
          <h1 className="mt-1 font-serif text-4xl font-medium text-ink">Hola{firstName ? `, ${firstName}` : ""}</h1>
          <p className="mt-2 text-[15px] text-ink-soft">
            {pending > 0 ? (
              <>
                Tenés{" "}
                <Link href="/admin/pedidos?estado=pendiente" className="font-semibold text-maleja-deep underline-offset-4 hover:underline">
                  {pending} {pending === 1 ? "pedido por atender" : "pedidos por atender"}
                </Link>
              </>
            ) : (
              "No hay pedidos pendientes"
            )}
            <span aria-hidden className="mx-2 text-ink/20">·</span>
            <span className="tabular-nums">
              {published.count ?? 0} de {totalProducts.count ?? 0}
            </span>{" "}
            prendas publicadas
            <span aria-hidden className="mx-2 text-ink/20">·</span>
            <span className="tabular-nums text-ink">{formatPYG(monthTotal)}</span> confirmados este mes
          </p>
        </div>
        <Link href="/admin/productos/nuevo" className={buttonStyles("primary", "md", "self-start sm:self-auto")}>
          <Plus className="size-4" /> Nueva prenda
        </Link>
      </header>

      {whatsappMissing && (
        <Link
          href="/admin/configuracion"
          className="mb-8 flex items-center gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3.5 text-sm text-amber-900 transition-colors hover:bg-amber-100"
        >
          <WhatsAppIcon className="size-4 shrink-0 text-amber-700" />
          <span className="flex-1">
            <strong>Configuración inicial:</strong> falta configurar el número de WhatsApp de la tienda. Hasta entonces las clientas no pueden enviar pedidos.
          </span>
          <ArrowRight className="size-4 shrink-0" />
        </Link>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Por atender: la tarea principal del día */}
        <section aria-labelledby="queue-title">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="queue-title" className="font-serif text-2xl text-ink">
              Por atender
            </h2>
            <Link href="/admin/pedidos" className="text-sm font-medium text-ink-soft hover:text-maleja-deep">
              Todos los pedidos
            </Link>
          </div>

          {queue.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-maleja-pastel/50 bg-white px-5 py-6 text-sm text-ink-soft">
              <span aria-hidden className="grid size-8 place-items-center rounded-full bg-ok/10 text-ok-deep">
                <Check className="size-4" />
              </span>
              Todo al día. Cuando una clienta envíe un pedido aparecerá aquí, el más antiguo primero.
            </div>
          ) : (
            <ul className="divide-y divide-maleja-pastel/40 overflow-hidden rounded-2xl border border-maleja-pastel/50 bg-white">
              {queue.map((o) => {
                const units = o.items.reduce((s, i) => s + i.quantity, 0);
                return (
                  <li key={o.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                    <Link href={`/admin/pedidos/${o.id}`} className="group min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <OrderTag number={o.order_number} />
                        <span className="text-xs text-ink-soft">{timeAgo(o.created_at)}</span>
                      </div>
                      <p className="mt-1.5 truncate font-medium text-ink group-hover:text-maleja-deep">{o.customer_name}</p>
                      <p className="text-xs text-ink-soft">
                        {units} {units === 1 ? "prenda" : "prendas"} · {PAYMENT_LABEL[o.payment_method]} ·{" "}
                        <span className="font-semibold tabular-nums text-ink">{formatPYG(o.total_pyg)}</span>
                      </p>
                    </Link>
                    <div className="flex gap-2">
                      <a
                        href={waLink(o.customer_phone, buildCustomerMessage(o.customer_name, o.order_number, "Pendiente de confirmación", businessName))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonStyles("outline", "sm", "flex-1 border-ok/40 text-ok-deep hover:border-ok hover:text-ok-deep sm:flex-none")}
                      >
                        <WhatsAppIcon className="size-4" /> Escribir
                      </a>
                      <Link href={`/admin/pedidos/${o.id}`} className={buttonStyles("dark", "sm", "flex-1 sm:flex-none")}>
                        Revisar <ChevronRight className="size-4" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {pending > queue.length && (
            <Link href="/admin/pedidos?estado=pendiente" className="mt-3 inline-flex min-h-[44px] items-center text-sm font-medium text-maleja-deep">
              Ver {pending - queue.length} pendientes más
            </Link>
          )}
        </section>

        <aside className="space-y-8">
          {/* Puesta a punto: progreso, no una lista de alertas */}
          {doneCount < setup.length && (
            <section aria-labelledby="setup-title">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 id="setup-title" className="font-serif text-2xl text-ink">
                  Puesta a punto
                </h2>
                <span className="text-sm tabular-nums text-ink-soft">
                  {doneCount}/{setup.length}
                </span>
              </div>
              <div
                className="mb-3 h-1 overflow-hidden rounded-full bg-maleja-pastel/40"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={setup.length}
                aria-valuenow={doneCount}
                aria-label="Configuración completada"
              >
                <div className="h-full origin-left rounded-full bg-maleja" style={{ transform: `scaleX(${doneCount / setup.length})` }} />
              </div>
              <ul className="space-y-0.5">
                {setup.map((t) => (
                  <li key={t.label}>
                    {t.done ? (
                      <span className="flex min-h-[40px] items-center gap-3 px-1 text-sm text-ink-soft line-through decoration-ink/20">
                        <Check aria-hidden className="size-4 text-ok-deep" />
                        <span>
                          <span className="sr-only">Completado: </span>
                          {t.label}
                        </span>
                      </span>
                    ) : (
                      <Link href={t.href} className="group flex min-h-[40px] items-center gap-3 rounded-xl px-1 text-sm text-ink hover:text-maleja-deep">
                        <span aria-hidden className={cn("size-4 rounded-full border-[1.5px]", t.critical ? "border-amber-500" : "border-ink/25")} />
                        <span className="flex-1">{t.label}</span>
                        <ChevronRight aria-hidden className="size-4 text-ink-soft transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Inventario: qué reponer (accionable), no un número suelto */}
          <section aria-labelledby="stock-title">
            <h2 id="stock-title" className="mb-3 font-serif text-2xl text-ink">
              Para reponer
            </h2>
            {lowStock.length === 0 ? (
              <p className="text-sm text-ink-soft">Ninguna variante con 2 unidades o menos.</p>
            ) : (
              <ul className="divide-y divide-maleja-pastel/40 rounded-2xl border border-maleja-pastel/50 bg-white">
                {lowStock.map((v) => (
                  <li key={v.id}>
                    <Link href={v.product ? `/admin/productos/${v.product.id}` : "/admin/productos"} className="flex items-center gap-3 px-4 py-3 hover:bg-maleja-canvas/60">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{v.product?.name ?? "Prenda"}</span>
                        <span className="block text-xs text-ink-soft">
                          Talla {v.size} · {v.color_name}
                        </span>
                      </span>
                      <span className={cn("text-sm font-semibold tabular-nums", v.stock === 0 ? "text-red-600" : "text-amber-700")}>
                        {v.stock === 0 ? "Agotado" : `${v.stock} u.`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
