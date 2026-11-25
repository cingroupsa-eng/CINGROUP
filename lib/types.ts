export type OrderStatus =
  | "pendiente"
  | "confirmado"
  | "preparando"
  | "listo_entrega"
  | "entregado"
  | "cancelado";

export type PaymentMethodId = "transferencia" | "efectivo";

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  enabled: boolean;
  details?: string;
}

export interface StoreSettings {
  id: number;
  business_name: string;
  slogan: string;
  logo_url: string | null;
  hero_image_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  whatsapp_number: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  address: string | null;
  business_hours: string | null;
  payment_methods: PaymentMethod[];
  delivery_info: string | null;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color_name: string;
  color_hex: string;
  stock: number;
  sku: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_pyg: number;
  compare_at_price_pyg: number | null;
  category_id: string | null;
  brand_id: string | null;
  is_published: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithRelations extends Product {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  brand: Pick<Brand, "id" | "name" | "slug"> | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  payment_method: PaymentMethodId;
  total_pyg: number;
  status: OrderStatus;
  stock_applied: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  size: string;
  color_name: string;
  quantity: number;
  unit_price_pyg: number;
  subtotal_pyg: number;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CartItem {
  key: string; // variantId
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  image: string | null;
  size: string;
  colorName: string;
  colorHex: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
