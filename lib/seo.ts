import type { Metadata } from "next";
import { BRAND } from "./constants";

/**
 * Metadatos coherentes por página: title, description, canonical y og:url
 * siempre apuntan a la misma URL.
 */
export function pageMeta({
  title,
  description,
  path,
  images,
  noindex,
}: {
  title?: string;
  description: string;
  path: string;
  images?: { url: string; alt?: string }[];
  noindex?: boolean;
}): Metadata {
  const ogTitle = title ? `${title} · ${BRAND.name}` : `${BRAND.name} — ${BRAND.slogan}`;
  // Sin fotos propias: tarjeta social de la marca (absoluta vía metadataBase).
  const cards = images?.length ? images : [{ url: "/opengraph-image", alt: `${BRAND.name} — ${BRAND.slogan}` }];
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      locale: BRAND.locale,
      url: path,
      title: ogTitle,
      description,
      images: cards,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: cards.map((i) => i.url),
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Canonical para listados paginados: cada página es canónica de sí misma; los filtros no. */
export function paginatedPath(base: string, page: number) {
  return page > 1 ? `${base}?pagina=${page}` : base;
}
