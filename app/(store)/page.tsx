import { getCategories, getHomeData, getSettings } from "@/lib/data";
import { Hero } from "@/components/store/Hero";
import { CategoryRail } from "@/components/store/CategoryRail";
import { Benefits } from "@/components/store/Benefits";
import { EmptyCollection } from "@/components/store/EmptyCollection";
import { ProductGrid } from "@/components/store/ProductCard";
import { SectionHeading } from "@/components/store/SectionHeading";
import { JsonLd } from "@/components/store/JsonLd";
import { BRAND, SITE_URL } from "@/lib/constants";
import { isSafeHttpUrl } from "@/lib/utils";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ description: BRAND.description, path: "/" });

export const revalidate = 120;

export default async function HomePage() {
  const [settings, categories, home] = await Promise.all([getSettings(), getCategories(), getHomeData()]);
  const hasProducts = home.publishedCount > 0;

  const sameAs = [settings.instagram_url, settings.facebook_url, settings.tiktok_url].filter(isSafeHttpUrl);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ClothingStore",
          name: settings.business_name,
          slogan: settings.slogan,
          url: SITE_URL,
          description: BRAND.description,
          currenciesAccepted: "PYG",
          paymentAccepted: settings.payment_methods.filter((p) => p.enabled).map((p) => p.label).join(", "),
          ...(settings.address ? { address: { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "PY" } } : {}),
          ...(settings.whatsapp_number ? { telephone: `+${settings.whatsapp_number}` } : {}),
          ...(sameAs.length ? { sameAs } : {}),
        }}
      />
      <Hero settings={settings} />

      <section className="container-lux py-12 sm:py-16" aria-labelledby="cats">
        <SectionHeading eyebrow="Explorá" title={<span id="cats">Comprar por categoría</span>} href="/tienda" linkLabel="Toda la tienda" />
        <CategoryRail categories={categories} />
      </section>

      {hasProducts ? (
        <>
          {home.newArrivals.length > 0 && (
            <section className="container-lux py-12 sm:py-16">
              <SectionHeading eyebrow="Recién llegadas" title={<>Novedades <span className="italic text-maleja-deep">de temporada</span></>} href="/tienda?orden=recientes" />
              <ProductGrid products={home.newArrivals} priorityCount={2} />
            </section>
          )}
          {home.featured.length > 0 && (
            <section className="bg-white py-16 sm:py-20">
              <div className="container-lux">
                <SectionHeading eyebrow="Selección Maleja" title={<>Nuestras <span className="italic text-maleja-deep">favoritas</span></>} href="/tienda" />
                <ProductGrid products={home.featured} />
              </div>
            </section>
          )}
          {home.onSale.length > 0 && (
            <section className="container-lux py-12 sm:py-16">
              <SectionHeading eyebrow="Precios especiales" title={<>Ofertas <span className="italic text-maleja-deep">irresistibles</span></>} href="/categoria/ofertas" />
              <ProductGrid products={home.onSale} />
            </section>
          )}
        </>
      ) : (
        <section className="container-lux py-8 sm:py-12">
          <EmptyCollection />
        </section>
      )}

      <section className="container-lux py-12 sm:py-16" aria-label="Beneficios">
        <Benefits />
      </section>
    </>
  );
}
