import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CreditCard, Truck } from "lucide-react";
import { getProductBySlug, getRelatedProducts, getSettings } from "@/lib/data";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { ProductGrid } from "@/components/store/ProductCard";
import { SectionHeading } from "@/components/store/SectionHeading";
import { JsonLd } from "@/components/store/JsonLd";
import { Price } from "@/components/ui/Price";
import { SITE_URL } from "@/lib/constants";
import { discountPercent } from "@/lib/utils";

export const revalidate = 120;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Producto no encontrado" };
  const description = (p.description || `${p.name} en EL BAZAR DE MALEJA. Pedí por WhatsApp.`).slice(0, 160);
  return {
    title: p.name,
    description,
    alternates: { canonical: `/producto/${p.slug}` },
    openGraph: {
      title: p.name,
      description,
      images: p.images.slice(0, 3).map((i) => ({ url: i.url, alt: i.alt_text || p.name })),
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();
  const related = await getRelatedProducts(product);
  const url = `${SITE_URL}/producto/${product.slug}`;
  const off = discountPercent(product.price_pyg, product.compare_at_price_pyg);
  const inStock = product.variants.some((v) => v.stock > 0);

  const badges = (
    <div className="flex flex-col items-start gap-1.5">
      {off && <span className="rounded-full bg-maleja px-3 py-1 text-xs font-semibold text-white">-{off}%</span>}
      {product.is_new && (
        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">Nuevo</span>
      )}
    </div>
  );

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description ?? undefined,
          image: product.images.map((i) => i.url),
          sku: product.variants[0]?.sku ?? product.id,
          brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
          category: product.category?.name,
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "PYG",
            price: product.price_pyg,
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            seller: { "@type": "Organization", name: settings.business_name },
          },
        }}
      />

      <div className="container-lux pb-8 pt-4 sm:pt-8">
        <nav aria-label="Migas de pan" className="mb-5 flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs text-ink-soft">
          <Link href="/" className="hover:text-maleja">
            Inicio
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          {product.category ? (
            <Link href={`/categoria/${product.category.slug}`} className="hover:text-maleja">
              {product.category.name}
            </Link>
          ) : (
            <Link href="/tienda" className="hover:text-maleja">
              Tienda
            </Link>
          )}
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <ProductGallery images={product.images} name={product.name} badges={badges} />

          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow">{product.brand?.name || product.category?.name || "El Bazar de Maleja"}</p>
            <h1 className="mt-3 font-serif text-[34px] font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">{product.name}</h1>
            <Price price={product.price_pyg} compareAt={product.compare_at_price_pyg} size="lg" className="mt-4" />

            <div className="my-7 h-px bg-maleja-pastel/40" />

            <ProductPurchase product={product} url={url} />

            {product.description && (
              <div className="mt-10">
                <h2 className="eyebrow mb-3">Descripción</h2>
                <div className="whitespace-pre-line text-[15px] leading-relaxed text-ink/85">{product.description}</div>
              </div>
            )}

            <div className="mt-8 divide-y divide-maleja-pastel/40 rounded-3xl border border-maleja-pastel/40 bg-white">
              <details className="group px-5 py-1" open>
                <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-3 text-sm font-medium text-ink">
                  <Truck className="h-4 w-4 text-maleja" /> Envíos y entregas
                  <ChevronRight className="ml-auto h-4 w-4 text-ink-soft transition-transform group-open:rotate-90" />
                </summary>
                <p className="whitespace-pre-line pb-4 text-sm leading-relaxed text-ink-soft">
                  {settings.delivery_info || "Coordinamos el envío o retiro por WhatsApp al confirmar tu pedido."}
                </p>
              </details>
              <details className="group px-5 py-1">
                <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-3 text-sm font-medium text-ink">
                  <CreditCard className="h-4 w-4 text-maleja" /> Formas de pago
                  <ChevronRight className="ml-auto h-4 w-4 text-ink-soft transition-transform group-open:rotate-90" />
                </summary>
                <ul className="space-y-1 pb-4 text-sm text-ink-soft">
                  {settings.payment_methods
                    .filter((p) => p.enabled)
                    .map((p) => (
                      <li key={p.id}>· {p.label}</li>
                    ))}
                </ul>
              </details>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-lux py-16">
          <SectionHeading
            eyebrow="Completá tu look"
            title={
              <>
                También te puede <span className="italic text-maleja">gustar</span>
              </>
            }
            href={product.category ? `/categoria/${product.category.slug}` : "/tienda"}
          />
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
