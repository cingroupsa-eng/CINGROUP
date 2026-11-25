import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug } from "@/lib/data";
import { CatalogView, parseFilters, type SearchParams } from "@/components/store/CatalogView";
import { pageMeta, paginatedPath } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const cat = await getCategoryBySlug(slug);
  if (!cat) return { title: "Categoría no encontrada", robots: { index: false } };
  const { page = 1 } = parseFilters(sp);
  return pageMeta({
    title: page > 1 ? `${cat.name} — página ${page}` : cat.name,
    description: cat.description ?? `${cat.name} en EL BAZAR DE MALEJA. Pedí por WhatsApp con envíos a todo Paraguay.`,
    path: paginatedPath(`/categoria/${cat.slug}`, page),
    images: cat.image_url ? [{ url: cat.image_url, alt: cat.name }] : undefined,
  });
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: Promise<SearchParams> }) {
  const [{ slug }, sp, categories] = await Promise.all([params, searchParams, getCategories()]);
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();
  return (
    <CatalogView
      eyebrow="Categoría"
      title={cat.slug === "ofertas" ? <span className="italic text-maleja">{cat.name}</span> : cat.name}
      description={cat.description}
      categorySlug={cat.slug}
      categories={categories}
      searchParams={sp}
      basePath={`/categoria/${cat.slug}`}
    />
  );
}
