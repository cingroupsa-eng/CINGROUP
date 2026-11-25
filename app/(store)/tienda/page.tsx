import type { Metadata } from "next";
import { getCategories } from "@/lib/data";
import { CatalogView, type SearchParams } from "@/components/store/CatalogView";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Descubrí toda la colección de EL BAZAR DE MALEJA: vestidos, blusas, conjuntos, calzados, carteras y accesorios.",
  alternates: { canonical: "/tienda" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [sp, categories] = await Promise.all([searchParams, getCategories()]);
  const q = typeof sp.q === "string" ? sp.q : "";
  return (
    <CatalogView
      eyebrow={q ? "Resultados de búsqueda" : "La colección"}
      title={
        q ? (
          <>
            “<span className="italic text-maleja">{q}</span>”
          </>
        ) : (
          <>
            Toda la <span className="italic text-maleja">tienda</span>
          </>
        )
      }
      description={q ? null : "Prendas seleccionadas para cada momento. Elegí, combiná y pedí por WhatsApp."}
      categories={categories}
      searchParams={sp}
      basePath="/tienda"
    />
  );
}
