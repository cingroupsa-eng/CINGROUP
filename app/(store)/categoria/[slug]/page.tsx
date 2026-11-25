import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug } from "@/lib/data";
import { CatalogView, type SearchParams } from "@/components/store/CatalogView";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return { title: "Categoría" };
  return {
    title: cat.name,
    description: cat.description ?? `${cat.name} en EL BAZAR DE MALEJA. Pedí por WhatsApp con envíos a todo Paraguay.`,
    alternates: { canonical: `/categoria/${cat.slug}` },
    openGraph: cat.image_url ? { images: [cat.image_url] } : undefined,
  };
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
