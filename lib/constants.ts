import type { Category, OrderStatus, PaymentMethod, StoreSettings } from "./types";

export const BRAND = {
  name: "EL BAZAR DE MALEJA",
  shortName: "Maleja",
  slogan: "Tu estilo, tu esencia.",
  description:
    "Boutique de moda femenina en Paraguay. Vestidos, blusas, conjuntos, calzados, carteras y accesorios seleccionados para vos. Pedidos por WhatsApp.",
  locale: "es_PY",
} as const;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "transferencia", label: "Transferencia bancaria", enabled: true, details: "" },
  { id: "efectivo", label: "Efectivo", enabled: true, details: "" },
];

/** Valores por defecto cuando la tienda todavía no se conectó a Supabase. */
export const DEFAULT_SETTINGS: StoreSettings = {
  id: 1,
  business_name: BRAND.name,
  slogan: BRAND.slogan,
  logo_url: null,
  hero_image_url: null,
  hero_title: null,
  hero_subtitle: null,
  whatsapp_number: null,
  instagram_url: null,
  facebook_url: null,
  tiktok_url: null,
  address: null,
  business_hours: null,
  payment_methods: DEFAULT_PAYMENT_METHODS,
  delivery_info: null,
};

/** Categorías base del negocio (mismas que precarga schema.sql). */
export const DEFAULT_CATEGORIES: Category[] = [
  ["Ropa", "ropa", "Prendas para cada momento de tu día."],
  ["Vestidos", "vestidos", "Siluetas que celebran tu feminidad."],
  ["Blusas", "blusas", "Básicos esenciales y piezas statement."],
  ["Pantalones", "pantalones", "Cortes cómodos con actitud."],
  ["Conjuntos", "conjuntos", "Looks completos, listos para brillar."],
  ["Calzados", "calzados", "El paso perfecto para cada ocasión."],
  ["Carteras", "carteras", "El complemento que define tu estilo."],
  ["Accesorios", "accesorios", "Detalles que hacen la diferencia."],
  ["Ofertas", "ofertas", "Precios especiales por tiempo limitado."],
].map(([name, slug, description], i) => ({
  id: `default-${slug}`,
  name,
  slug,
  description,
  image_url: null,
  display_order: i + 1,
  is_active: true,
}));

export const ORDER_STATUSES: { id: OrderStatus; label: string; tone: string; dot: string }[] = [
  { id: "pendiente", label: "Pendiente", tone: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  { id: "confirmado", label: "Confirmado", tone: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  { id: "preparando", label: "Preparando", tone: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  { id: "listo_entrega", label: "Listo para entrega", tone: "bg-maleja-canvas text-maleja ring-maleja-pastel", dot: "bg-maleja" },
  { id: "entregado", label: "Entregado", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-ok" },
  { id: "cancelado", label: "Cancelado", tone: "bg-zinc-100 text-zinc-600 ring-zinc-200", dot: "bg-zinc-400" },
];

export const statusMeta = (s: OrderStatus) => ORDER_STATUSES.find((x) => x.id === s) ?? ORDER_STATUSES[0];

export const PAYMENT_LABEL: Record<string, string> = {
  transferencia: "Transferencia bancaria",
  efectivo: "Efectivo",
};

export const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "Único", "34", "35", "36", "37", "38", "39", "40"];

export const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "ÚNICO", "UNICO"];

export const SORT_OPTIONS = [
  { id: "recientes", label: "Más recientes" },
  { id: "precio-asc", label: "Precio: menor a mayor" },
  { id: "precio-desc", label: "Precio: mayor a menor" },
  { id: "nombre", label: "Nombre (A–Z)" },
] as const;

export type SortId = (typeof SORT_OPTIONS)[number]["id"];

export const PAGE_SIZE = 24;
