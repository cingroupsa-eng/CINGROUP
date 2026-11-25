import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, Package, PackageX, Plus, Wallet } from "lucide-react";
import { getAdminContext } from "@/lib/auth";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { buttonStyles } from "@/components/ui/Button";
import type { Order, StoreSettings } from "@/lib/types";
import { cn, formatDate, formatPYG } from "@/lib/utils";

export const metadata: Metadata = { title: "Inicio" };

export default async function DashboardPage() {
  const ctx = (await getAdminContext())!;
  const sb = ctx.supabase;

  const [pending, published, totalProducts, lowStock, recent, settingsRes, catCount, monthRes] = await Promise.all([
    sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
    sb.from("products").select("id", { count: "exact", head: true }).eq("is_published", true),
    sb.from("products").select("id", { count: "exact", head: true }),
    sb.from("product_variants").select("id", { count: "exact", head: true }).lte("stock", 2),
    sb.from("orders").select("*").order("created_at", { ascending: false }).limit(6),
    sb.from("store_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
    sb
      .from("orders")
      .select("total_pyg")
      .in("status", ["confirmado", "preparando", "listo_entrega", "entregado"])
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  const settings = settingsRes.data as StoreSettings | null;
  const orders = (recent.data ?? []) as Order[];
  const monthTotal = (monthRes.data ?? []).reduce((s, o) => s + ((o.total_pyg as number) ?? 0), 0);

  const checklist = [
    { done: Boolean(settings?.whatsapp_number), label: "Falta configurar el número de WhatsApp de la tienda", critical: true, href: "/admin/configuracion" },
    { done: (published.count ?? 0) > 0, label: "Todavía no hay prendas publicadas en la tienda", critical: false, href: "/admin/productos/nuevo" },
    { done: (catCount.count ?? 0) > 0, label: "No hay categorías activas", critical: false, href: "/admin/categorias" },
    { done: Boolean(settings?.instagram_url || settings?.facebook_url || settings?.tiktok_url), label: "Agregá tus redes sociales", critical: false, href: "/admin/configuracion" },
    { done: Boolean(settings?.delivery_info), label: "Completá la información de entregas", critical: false, href: "/admin/configuracion" },
    { done: Boolean(settings?.business_hours && settings?.address), label: "Cargá horarios y dirección", critical: false, href: "/admin/configuracion" },
    { done: Boolean(settings?.hero_image_url), label: "Subí la foto principal de la portada", critical: false, href: "/admin/configuracion" },
  ];
  const pendingTasks = checklist.filter((c) => !c.done);

  const stats = [
    { label: "Pedidos pendientes", value: pending.count ?? 0, Icon: ClipboardList, href: "/admin/pedidos?estado=pendiente", accent: true },
    { label: "Prendas publicadas", value: `${published.count ?? 0} / ${totalProducts.count ?? 0}`, Icon: Package, href: "/admin/productos" },
    { label: "Variantes con poco stock", value: lowStock.count ?? 0, Icon: PackageX, href: "/admin/productos" },
    { label: "Ventas confirmadas del mes", value: formatPYG(monthTotal), Icon: Wallet, href: "/admin/pedidos" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`¡Hola${ctx.profile?.full_name ? `, ${ctx.profile.full_name.split(" ")[0]}` : ""}!`}
        description="Este es el resumen de tu tienda."
        actions={
          <Link href="/admin/productos/nuevo" className={buttonStyles("primary", "md")}>
            <Plus className="h-4 w-4" /> Nueva prenda
          </Link>
        }
      />

      {pendingTasks.length > 0 && (
        <section className="mb-8 space-y-2">
          {pendingTasks.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className={cn(
                "group flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-sm ring-1 transition",
                t.critical ? "bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100" : "bg-white text-ink ring-maleja-pastel/40 hover:ring-maleja-pastel"
              )}
            >
              <AlertTriangle className={cn("h-4 w-4 shrink-0", t.critical ? "text-amber-600" : "text-maleja")} />
              <span className="flex-1">
                {t.critical && <strong className="mr-1">Configuración inicial:</strong>}
                {t.label}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
          ))}
        </section>
      )}
      {pendingTasks.length === 0 && (
        <div className="mb-8 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> ¡Tu tienda está completamente configurada!
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {stats.map(({ label, value, Icon, href, accent }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "group rounded-3xl p-5 ring-1 transition-all duration-300 ease-lux hover:-translate-y-0.5 hover:shadow-soft",
              accent ? "bg-maleja text-white ring-maleja" : "bg-white ring-maleja-pastel/40"
            )}
          >
            <Icon className={cn("h-5 w-5", accent ? "text-white/80" : "text-maleja")} strokeWidth={1.8} />
            <p className={cn("mt-4 font-sans text-2xl font-semibold tabular-nums sm:text-3xl", accent ? "text-white" : "text-ink")}>{value}</p>
            <p className={cn("mt-1 text-xs", accent ? "text-white/80" : "text-ink-soft")}>{label}</p>
          </Link>
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Últimos pedidos</h2>
          <Link href="/admin/pedidos" className="text-sm font-medium text-maleja">
            Ver todos
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-maleja-pastel bg-white px-6 py-12 text-center text-sm text-ink-soft">
            Aún no recibiste pedidos. Cuando una clienta envíe su solicitud, aparecerá aquí.
          </div>
        ) : (
          <ul className="divide-y divide-maleja-pastel/30 overflow-hidden rounded-3xl bg-white ring-1 ring-maleja-pastel/40">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/pedidos/${o.id}`} className="flex items-center gap-4 px-4 py-4 transition hover:bg-maleja-canvas/60 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {o.order_number} <span className="font-normal text-ink-soft">· {o.customer_name}</span>
                    </p>
                    <p className="text-xs text-ink-soft">{formatDate(o.created_at)}</p>
                  </div>
                  <StatusBadge status={o.status} className="hidden sm:inline-flex" />
                  <span className="text-sm font-semibold tabular-nums">{formatPYG(o.total_pyg)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
