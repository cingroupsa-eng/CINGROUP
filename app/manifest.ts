import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: BRAND.name,
    short_name: "Maleja",
    description: `${BRAND.slogan} ${BRAND.description}`,
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFF7FA",
    theme_color: "#FFF7FA",
    lang: "es-PY",
    dir: "ltr",
    categories: ["shopping", "lifestyle", "fashion"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Tienda", url: "/tienda", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Ofertas", url: "/categoria/ofertas", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
