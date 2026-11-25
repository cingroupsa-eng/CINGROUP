import "server-only";
import { cache } from "react";
import { getPublicSupabase } from "./supabase/server";
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, DEFAULT_SETTINGS, PAGE_SIZE, type SortId } from "./constants";
import type { Category, PaymentMethod, ProductWithRelations, StoreSettings } from "./types";
import { sizeRank, sortSizes } from "./utils";

export const PRODUCT_SELECT =
  "*, category:categories(id,name,slug), brand:brands(id,name,slug), images:product_images(*), variants:product_variants(*)";

/** Ordena imágenes y variantes anidadas de forma estable. */
export function normalizeProduct(raw: unknown): ProductWithRelations {
  const p = raw as ProductWithRelations;
  return {
    ...p,
    images: [...(p.images ?? [])].sort((a, b) => a.display_order - b.display_order),
    variants: [...(p.variants ?? [])].sort(
      (a, b) => a.color_name.localeCompare(b.color_name) || sizeRank(a.size) - sizeRank(b.size)
    ),
  };
}

function logError(scope: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") console.error(`[data:${scope}]`, error);
}

// ─── Configuración ────────────────────────────────────────────
export const getSettings = cache(async (): Promise<StoreSettings> => {
  const sb = getPublicSupabase();
  if (!sb) return DEFAULT_SETTINGS;
  const { data, error } = await sb.from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) {
    logError("settings", error);
    return DEFAULT_SETTINGS;
  }
  const pm = Array.isArray(data.payment_methods) ? (data.payment_methods as PaymentMethod[]) : DEFAULT_PAYMENT_METHODS;
  return { ...DEFAULT_SETTINGS, ...data, payment_methods: pm } as StoreSettings;
});

// ─── Categorías ───────────────────────────────────────────────
export const getCategories = cache(async (): Promise<Category[]> => {
  const sb = getPublicSupabase();
  if (!sb) return DEFAULT_CATEGORIES;
  const { data, error } = await sb
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order")
    .order("name");
  if (error) {
    logError("categories", error);
    return DEFAULT_CATEGORIES;
  }
  return (data ?? []) as Category[];
});

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const cats = await getCategories();
  return cats.find((c) => c.slug === slug) ?? null;
});

// ─── Productos ────────────────────────────────────────────────
export interface ProductFilters {
  categorySlug?: string;
  q?: string;
  sizes?: string[];
  colors?: string[];
  min?: number;
  max?: number;
  sort?: SortId;
  page?: number;
  onSale?: boolean;
}

export interface ProductPage {
  products: ProductWithRelations[];
  total: number;
  page: number;
  pageCount: number;
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductPage> {
  const empty: ProductPage = { products: [], total: 0, page: 1, pageCount: 0 };
  const sb = getPublicSupabase();
  if (!sb) return empty;

  const page = Math.max(1, filters.page ?? 1);
  let query = sb.from("products").select(PRODUCT_SELECT, { count: "exact" }).eq("is_published", true);

  if (filters.categorySlug) {
    const cat = await getCategoryBySlug(filters.categorySlug);
    if (!cat || cat.id.startsWith("default-")) return empty;
    query =
      cat.slug === "ofertas"
        ? query.or(`is_on_sale.eq.true,category_id.eq.${cat.id}`)
        : query.eq("category_id", cat.id);
  }
  if (filters.onSale) query = query.eq("is_on_sale", true);

  if (filters.q) {
    const term = filters.q.replace(/[%_,()*]/g, " ").trim().slice(0, 60);
    if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (filters.min && filters.min > 0) query = query.gte("price_pyg", filters.min);
  if (filters.max && filters.max > 0) query = query.lte("price_pyg", filters.max);

  if (filters.sizes?.length || filters.colors?.length) {
    let vq = sb.from("product_variants").select("product_id").gt("stock", 0);
    if (filters.sizes?.length) vq = vq.in("size", filters.sizes);
    if (filters.colors?.length) vq = vq.in("color_name", filters.colors);
    const { data: vrows, error: verr } = await vq.limit(2000);
    if (verr) {
      logError("variants-filter", verr);
      return empty;
    }
    const ids = Array.from(new Set((vrows ?? []).map((r) => r.product_id as string)));
    if (!ids.length) return empty;
    query = query.in("id", ids);
  }

  switch (filters.sort) {
    case "precio-asc":
      query = query.order("price_pyg", { ascending: true });
      break;
    case "precio-desc":
      query = query.order("price_pyg", { ascending: false });
      break;
    case "nombre":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) {
    logError("products", error);
    return empty;
  }
  const total = count ?? 0;
  return {
    products: (data ?? []).map(normalizeProduct),
    total,
    page,
    pageCount: Math.ceil(total / PAGE_SIZE),
  };
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductWithRelations | null> => {
  const sb = getPublicSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) logError("product", error);
  return data ? normalizeProduct(data) : null;
});

export async function getRelatedProducts(product: ProductWithRelations, limit = 4): Promise<ProductWithRelations[]> {
  const sb = getPublicSupabase();
  if (!sb || !product.category_id) return [];
  const { data, error } = await sb
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) logError("related", error);
  return (data ?? []).map(normalizeProduct);
}

export interface HomeData {
  newArrivals: ProductWithRelations[];
  onSale: ProductWithRelations[];
  featured: ProductWithRelations[];
  publishedCount: number;
}

export const getHomeData = cache(async (): Promise<HomeData> => {
  const sb = getPublicSupabase();
  const empty: HomeData = { newArrivals: [], onSale: [], featured: [], publishedCount: 0 };
  if (!sb) return empty;
  const base = () => sb.from("products").select(PRODUCT_SELECT).eq("is_published", true);
  const [n, s, f, c] = await Promise.all([
    base().eq("is_new", true).order("created_at", { ascending: false }).limit(8),
    base().eq("is_on_sale", true).order("updated_at", { ascending: false }).limit(8),
    base().eq("is_featured", true).order("updated_at", { ascending: false }).limit(8),
    sb.from("products").select("id", { count: "exact", head: true }).eq("is_published", true),
  ]);
  [n, s, f, c].forEach((r, i) => r.error && logError(`home-${i}`, r.error));
  return {
    newArrivals: (n.data ?? []).map(normalizeProduct),
    onSale: (s.data ?? []).map(normalizeProduct),
    featured: (f.data ?? []).map(normalizeProduct),
    publishedCount: c.count ?? 0,
  };
});

export interface FilterOptions {
  sizes: string[];
  colors: { name: string; hex: string }[];
}

export async function getFilterOptions(categorySlug?: string): Promise<FilterOptions> {
  const sb = getPublicSupabase();
  if (!sb) return { sizes: [], colors: [] };
  let q = sb
    .from("product_variants")
    .select("size, color_name, color_hex, product:products!inner(category_id, is_published)")
    .eq("product.is_published", true)
    .gt("stock", 0);
  if (categorySlug && categorySlug !== "ofertas") {
    const cat = await getCategoryBySlug(categorySlug);
    if (cat && !cat.id.startsWith("default-")) q = q.eq("product.category_id", cat.id);
  }
  const { data, error } = await q.limit(3000);
  if (error) {
    logError("filter-options", error);
    return { sizes: [], colors: [] };
  }
  const sizes = sortSizes(Array.from(new Set((data ?? []).map((r) => r.size as string))));
  const colorMap = new Map<string, string>();
  (data ?? []).forEach((r) => {
    if (!colorMap.has(r.color_name as string)) colorMap.set(r.color_name as string, r.color_hex as string);
  });
  return {
    sizes,
    colors: Array.from(colorMap, ([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function getAllPublishedSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const sb = getPublicSupabase();
  if (!sb) return [];
  const { data } = await sb.from("products").select("slug, updated_at").eq("is_published", true).limit(5000);
  return (data ?? []) as { slug: string; updated_at: string }[];
}
