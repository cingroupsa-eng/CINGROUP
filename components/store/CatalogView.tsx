import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFilterOptions, getProducts, type ProductFilters } from "@/lib/data";
import type { Category } from "@/lib/types";
import { SORT_OPTIONS, type SortId } from "@/lib/constants";
import { CatalogFilters, DesktopFilters } from "./CatalogFilters";
import { ProductGrid } from "./ProductCard";
import { EmptyCollection } from "./EmptyCollection";
import { buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseFilters(sp: SearchParams): Omit<ProductFilters, "categorySlug"> {
  const list = (k: string) =>
    one(sp[k])
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);
  const num = (k: string) => {
    const n = parseInt(one(sp[k]).replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const sortRaw = one(sp.orden);
  const sort = (SORT_OPTIONS.some((o) => o.id === sortRaw) ? sortRaw : "recientes") as SortId;
  return {
    q: one(sp.q).slice(0, 60) || undefined,
    sizes: list("talla"),
    colors: list("color"),
    min: num("min"),
    max: num("max"),
    sort,
    page: num("pagina") ?? 1,
  };
}

export async function CatalogView({
  eyebrow,
  title,
  description,
  categorySlug,
  categories,
  searchParams,
  basePath,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string | null;
  categorySlug?: string;
  categories: Category[];
  searchParams: SearchParams;
  basePath: string;
}) {
  const filters = parseFilters(searchParams);
  const [page, options] = await Promise.all([getProducts({ ...filters, categorySlug }), getFilterOptions(categorySlug)]);
  const filterKey = JSON.stringify(searchParams);
  const hasFilters = Boolean(filters.q || filters.sizes?.length || filters.colors?.length || filters.min || filters.max);

  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      const val = one(v);
      if (val && k !== "pagina") p.set(k, val);
    });
    if (n > 1) p.set("pagina", String(n));
    return `${basePath}${p.toString() ? `?${p}` : ""}`;
  };

  return (
    <div className="container-lux pb-10 pt-8 sm:pt-12">
      <header className="mb-8 text-center sm:mb-10">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="heading-lg mt-3 text-ink">{title}</h1>
        {description && <p className="mx-auto mt-3 max-w-xl text-[15px] text-ink-soft">{description}</p>}
      </header>

      <nav aria-label="Categorías" className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
        <Link
          href="/tienda"
          className={cn(
            "min-h-[40px] shrink-0 rounded-full border px-4 py-2 text-sm transition",
            !categorySlug ? "border-ink bg-ink text-white" : "border-maleja-pastel/60 bg-white text-ink hover:border-maleja hover:text-maleja"
          )}
        >
          Todo
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/categoria/${c.slug}`}
            className={cn(
              "min-h-[40px] shrink-0 rounded-full border px-4 py-2 text-sm transition",
              categorySlug === c.slug
                ? "border-ink bg-ink text-white"
                : "border-maleja-pastel/60 bg-white text-ink hover:border-maleja hover:text-maleja"
            )}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
        {/* key = URL actual: el borrador de filtros se reinicia al navegar, sin efectos de sincronización */}
        <DesktopFilters key={`d-${filterKey}`} options={options} />
        <div>
          <CatalogFilters key={`m-${filterKey}`} options={options} total={page.total} />
          <div className="mt-8">
            {page.products.length > 0 ? (
              <ProductGrid products={page.products} priorityCount={4} />
            ) : hasFilters ? (
              <div className="rounded-[28px] border border-dashed border-maleja-pastel bg-white px-6 py-16 text-center">
                <p className="font-serif text-3xl italic text-ink">No encontramos prendas con estos filtros</p>
                <p className="mt-2 text-sm text-ink-soft">Probá quitando algún filtro o explorá otra categoría.</p>
                <Link href={basePath} className={buttonStyles("dark", "md", "mt-6")}>
                  Limpiar filtros
                </Link>
              </div>
            ) : (
              <EmptyCollection compact />
            )}
          </div>

          {page.pageCount > 1 && (
            <nav aria-label="Paginación" className="mt-14 flex items-center justify-center gap-2">
              {page.page > 1 && (
                <Link href={pageHref(page.page - 1)} aria-label="Página anterior" className={buttonStyles("outline", "icon")}>
                  <ChevronLeft className="size-4" />
                </Link>
              )}
              {Array.from({ length: page.pageCount }, (_, i) => i + 1)
                .filter((n) => Math.abs(n - page.page) <= 2 || n === 1 || n === page.pageCount)
                .map((n) => (
                  <Link
                    key={n}
                    href={pageHref(n)}
                    aria-current={n === page.page ? "page" : undefined}
                    className={cn(
                      "grid h-11 min-w-11 place-items-center rounded-full px-3 text-sm transition",
                      n === page.page ? "bg-ink text-white" : "text-ink hover:bg-white"
                    )}
                  >
                    {n}
                  </Link>
                ))}
              {page.page < page.pageCount && (
                <Link href={pageHref(page.page + 1)} aria-label="Página siguiente" className={buttonStyles("outline", "icon")}>
                  <ChevronRight className="size-4" />
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
