import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { getAdminContext } from "@/lib/auth";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ORDER_STATUSES, PAYMENT_LABEL } from "@/lib/constants";
import type { Order, OrderStatus } from "@/lib/types";
import { cn, formatDate, formatPYG, prettyPhone } from "@/lib/utils";

export const metadata: Metadata = { title: "Pedidos" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const ctx = (await getAdminContext())!;
  const estado = ORDER_STATUSES.some((s) => s.id === sp.estado) ? (sp.estado as OrderStatus) : null;
  const q = (sp.q ?? "").replace(/[%_,()*]/g, " ").trim().slice(0, 60);

  let query = ctx.supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (estado) query = query.eq("status", estado);
  if (q) {
    const digits = q.replace(/\D/g, "");
    const parts = [`order_number.ilike.%${q}%`, `customer_name.ilike.%${q}%`];
    if (digits.length >= 4) parts.push(`customer_phone.ilike.%${digits.replace(/^0/, "")}%`);
    query = query.or(parts.join(","));
  }

  const [{ data }, counts] = await Promise.all([
    query,
    Promise.all(
      ORDER_STATUSES.map(async (s) => {
        const { count } = await ctx.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", s.id);
        return [s.id, count ?? 0] as const;
      })
    ),
  ]);
  const orders = (data ?? []) as Order[];
  const countMap = Object.fromEntries(counts) as Record<OrderStatus, number>;

  const tabHref = (s: string | null) => {
    const p = new URLSearchParams();
    if (s) p.set("estado", s);
    if (q) p.set("q", q);
    return `/admin/pedidos${p.toString() ? `?${p}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Pedidos" description="Solicitudes recibidas desde la tienda. Confirmá un pedido para descontar el stock automáticamente." />

      <form action="/admin/pedidos" className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por N° de pedido, nombre o teléfono…"
          className="h-12 w-full rounded-full border border-maleja-pastel/60 bg-white pl-11 pr-4 text-[16px] focus:border-maleja focus:outline-none focus:ring-4 focus:ring-maleja/10 sm:text-sm"
        />
        {estado && <input type="hidden" name="estado" value={estado} />}
      </form>

      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={tabHref(null)} className={cn("min-h-[40px] shrink-0 rounded-full px-4 py-2 text-sm", !estado ? "bg-ink text-white" : "bg-white ring-1 ring-maleja-pastel/50")}>
          Todos
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s.id}
            href={tabHref(s.id)}
            className={cn(
              "inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm",
              estado === s.id ? "bg-ink text-white" : "bg-white ring-1 ring-maleja-pastel/50"
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", s.dot)} />
            {s.label}
            {countMap[s.id] > 0 && <span className={cn("text-xs", estado === s.id ? "text-white/70" : "text-ink-soft")}>{countMap[s.id]}</span>}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-maleja-pastel bg-white px-6 py-16 text-center text-sm text-ink-soft">
          {q || estado ? "No hay pedidos que coincidan." : "Aún no recibiste pedidos."}
        </div>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/pedidos/${o.id}`}
                className="flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-maleja-pastel/40 transition hover:ring-maleja-pastel sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{o.order_number}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 truncate text-sm text-ink">{o.customer_name}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {prettyPhone(o.customer_phone)} · {PAYMENT_LABEL[o.payment_method]} · {formatDate(o.created_at)}
                  </p>
                </div>
                <span className="shrink-0 text-right text-sm font-semibold tabular-nums sm:text-base">{formatPYG(o.total_pyg)}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
