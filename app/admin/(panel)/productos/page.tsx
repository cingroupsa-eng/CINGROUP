import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { getAdminContext } from "@/lib/auth";
import { PageHeader } from "@/components/admin/AdminShell";
import { FeaturedToggle, PublishToggle } from "@/components/admin/ProductRowActions";
import { buttonStyles } from "@/components/ui/Button";
import { normalizeProduct, PRODUCT_SELECT } from "@/lib/data";
import type { Category } from "@/lib/types";
import { cn, formatPYG } from "@/lib/utils";

export const metadata: Metadata = { title: "Productos" };

type SP = Promise<Record<string, string | undefined>>;

export default async function ProductsAdminPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const ctx = (await getAdminContext())!;
  const q = (sp.q ?? "").replace(/[%_,()*]/g, " ").trim().slice(0, 60);
  const estado = sp.estado ?? "todos";
  const categoria = sp.categoria ?? "";

  let query = ctx.supabase.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false }).limit(300);
  if (q) query = query.ilike("name", `%${q}%`);
  if (estado === "publicados") query = query.eq("is_published", true);
  if (estado === "ocultos") query = query.eq("is_published", false);
  if (estado === "destacados") query = query.eq("is_featured", true);
  if (estado === "ofertas") query = query.eq("is_on_sale", true);
  if (categoria) query = query.eq("category_id", categoria);

  const [{ data }, { data: cats }] = await Promise.all([
    query,
    ctx.supabase.from("categories").select("id,name").order("display_order"),
  ]);
  const products = (data ?? []).map(normalizeProduct);
  const categories = (cats ?? []) as Pick<Category, "id" | "name">[];

  const tabs = [
    { id: "todos", label: "Todos" },
    { id: "publicados", label: "Publicados" },
    { id: "ocultos", label: "Ocultos" },
    { id: "destacados", label: "Destacados" },
    { id: "ofertas", label: "En oferta" },
  ];
  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(q && { q }), ...(estado !== "todos" && { estado }), ...(categoria && { categoria }), ...patch });
    [...p.entries()].forEach(([k, v]) => (!v || (k === "estado" && v === "todos")) && p.delete(k));
    return `/admin/productos${p.toString() ? `?${p}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Productos"
        description="Cargá, editá y publicá las prendas de tu tienda."
        actions={
          <Link href="/admin/productos/nuevo" className={buttonStyles("primary", "md")}>
            <Plus className="size-4" /> Nueva prenda
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <form className="relative flex-1" action="/admin/productos">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre…"
            className="h-12 w-full rounded-full border border-maleja-pastel/60 bg-white pl-11 pr-4 text-[16px] focus:border-maleja focus:outline-none focus:ring-4 focus:ring-maleja/10 sm:text-sm"
          />
          {estado !== "todos" && <input type="hidden" name="estado" value={estado} />}
          {categoria && <input type="hidden" name="categoria" value={categoria} />}
        </form>
        <form action="/admin/productos" className="flex gap-2">
          {q && <input type="hidden" name="q" value={q} />}
          {estado !== "todos" && <input type="hidden" name="estado" value={estado} />}
          <select
            name="categoria"
            defaultValue={categoria}
            className="h-12 rounded-full border border-maleja-pastel/60 bg-white px-4 text-[16px] sm:text-sm"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className={buttonStyles("outline", "md")}>Filtrar</button>
        </form>
      </div>

      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={href({ estado: t.id })}
            className={cn(
              "min-h-[40px] shrink-0 rounded-full px-4 py-2 text-sm transition",
              estado === t.id ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-maleja-pastel/50 hover:ring-maleja"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-maleja-pastel bg-white px-6 py-16 text-center">
          <p className="font-serif text-2xl">{q || estado !== "todos" || categoria ? "Sin resultados" : "Aún no cargaste prendas"}</p>
          <p className="mt-2 text-sm text-ink-soft">
            {q || estado !== "todos" || categoria ? "Probá con otros filtros." : "Empezá cargando tu primera prenda con fotos, precio y tallas."}
          </p>
          <Link href="/admin/productos/nuevo" className={buttonStyles("primary", "md", "mt-6")}>
            <Plus className="size-4" /> Cargar prenda
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {products.map((p) => {
            const stock = p.variants.reduce((s, v) => s + v.stock, 0);
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-3xl bg-white p-3 ring-1 ring-maleja-pastel/40 sm:gap-4 sm:p-4">
                <Link href={`/admin/productos/${p.id}`} className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl bg-maleja-canvas sm:h-24 sm:w-20">
                  {p.images[0] ? (
                    <Image src={p.images[0].url} alt={p.name} fill sizes="80px" className="object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center font-serif text-2xl italic text-maleja-pastel">M</span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/productos/${p.id}`} className="block truncate font-medium text-ink hover:text-maleja-deep">
                    {p.name}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">
                    {p.category?.name ?? "Sin categoría"} · {p.variants.length} variante(s) ·{" "}
                    <span className={cn(stock === 0 ? "font-medium text-red-600" : stock <= 3 ? "font-medium text-amber-600" : "")}>
                      Stock {stock}
                    </span>
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatPYG(p.price_pyg)}
                    {p.compare_at_price_pyg && <span className="ml-2 text-xs font-normal text-ink-soft line-through">{formatPYG(p.compare_at_price_pyg)}</span>}
                  </p>
                  <div className="mt-1 sm:hidden">
                    <PublishToggle id={p.id} value={p.is_published} />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <PublishToggle id={p.id} value={p.is_published} />
                </div>
                <FeaturedToggle id={p.id} value={p.is_featured} />
                <Link href={`/admin/productos/${p.id}`} aria-label={`Editar ${p.name}`} className="grid size-11 place-items-center rounded-full text-ink transition hover:bg-maleja-canvas hover:text-maleja-deep">
                  <Pencil className="size-4" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
