import { z } from "zod";
import { normalizeParaguayPhone } from "./utils";

const trimmed = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null));

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || /^https?:\/\/.+\..+/i.test(v), "Ingresá un enlace válido (https://...)")
  .transform((v) => (v ? v : null));

// ─── Checkout ─────────────────────────────────────────────────
export const checkoutFormSchema = z.object({
  customerName: trimmed(120).min(3, "Ingresá tu nombre completo"),
  customerPhone: z
    .string()
    .trim()
    .min(6, "Ingresá tu número de teléfono")
    .refine((v) => normalizeParaguayPhone(v) !== null, "Número inválido. Ej.: 0981 123 456"),
  paymentMethod: z.enum(["transferencia", "efectivo"], {
    errorMap: () => ({ message: "Elegí un método de pago" }),
  }),
  notes: z.string().trim().max(600, "Máximo 600 caracteres").optional(),
});
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const checkoutPayloadSchema = checkoutFormSchema.extend({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1, "Tu bolsa está vacía")
    .max(40),
});
export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>;

// ─── Productos ────────────────────────────────────────────────
export const variantSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  size: trimmed(30).min(1, "Talla requerida"),
  color_name: trimmed(40).min(1, "Color requerido"),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido"),
  stock: z.coerce.number({ invalid_type_error: "Stock inválido" }).int("Sin decimales").min(0, "Mínimo 0").max(100000),
  sku: optionalText(60),
});

export const productImageSchema = z.object({
  url: z.string().url(),
  alt_text: optionalText(160),
});

export const productSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: trimmed(140).min(2, "Ingresá el nombre de la prenda"),
    slug: z
      .string()
      .trim()
      .max(90)
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), "Sólo minúsculas, números y guiones"),
    description: optionalText(4000),
    price_pyg: z.coerce
      .number({ invalid_type_error: "Ingresá un precio" })
      .int("El precio en Guaraníes no lleva decimales")
      .min(1, "Ingresá un precio mayor a 0")
      .max(2_000_000_000),
    compare_at_price_pyg: z.coerce
      .number()
      .int()
      .min(0)
      .max(2_000_000_000)
      .nullable()
      .optional()
      .transform((v) => (v ? v : null)),
    category_id: z.string().uuid("Elegí una categoría"),
    brand_id: z
      .string()
      .uuid()
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : null)),
    is_published: z.boolean(),
    is_featured: z.boolean(),
    is_new: z.boolean(),
    is_on_sale: z.boolean(),
    images: z.array(productImageSchema).max(12, "Máximo 12 fotos"),
    variants: z.array(variantSchema).min(1, "Agregá al menos una variante (talla + color)").max(80),
  })
  .superRefine((v, ctx) => {
    if (v.compare_at_price_pyg && v.compare_at_price_pyg <= v.price_pyg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compare_at_price_pyg"],
        message: "El precio anterior debe ser mayor al precio actual",
      });
    }
    const seen = new Set<string>();
    v.variants.forEach((va, i) => {
      const k = `${va.size.toLowerCase()}|${va.color_name.toLowerCase()}`;
      if (seen.has(k)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", i, "size"],
          message: "Combinación talla + color repetida",
        });
      }
      seen.add(k);
    });
  });
export type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormValues = z.output<typeof productSchema>;

// ─── Categorías / Marcas ──────────────────────────────────────
export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: trimmed(60).min(2, "Ingresá un nombre"),
  slug: z
    .string()
    .trim()
    .max(70)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), "Sólo minúsculas, números y guiones"),
  description: optionalText(240),
  image_url: optionalUrl,
  is_active: z.boolean(),
});
export type CategoryFormInput = z.input<typeof categorySchema>;
export type CategoryFormValues = z.output<typeof categorySchema>;

export const brandSchema = z.object({
  id: z.string().uuid().optional(),
  name: trimmed(60).min(2, "Ingresá un nombre"),
});

// ─── Configuración ────────────────────────────────────────────
export const settingsSchema = z.object({
  business_name: trimmed(80).min(2, "Ingresá el nombre del negocio"),
  slogan: trimmed(120).min(2, "Ingresá un eslogan"),
  logo_url: optionalUrl,
  hero_image_url: optionalUrl,
  hero_title: optionalText(90),
  hero_subtitle: optionalText(220),
  whatsapp_number: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || normalizeParaguayPhone(v) !== null, "Número inválido. Usá el formato 595981123456")
    .transform((v) => (v ? normalizeParaguayPhone(v) : null)),
  instagram_url: optionalUrl,
  facebook_url: optionalUrl,
  tiktok_url: optionalUrl,
  address: optionalText(240),
  business_hours: optionalText(240),
  delivery_info: optionalText(800),
  payment_methods: z
    .array(
      z.object({
        id: z.enum(["transferencia", "efectivo"]),
        label: trimmed(40).min(2),
        enabled: z.boolean(),
        details: z.string().trim().max(400).optional(),
      })
    )
    .length(2)
    .refine((pm) => pm.some((p) => p.enabled), "Activá al menos un método de pago"),
});
export type SettingsFormInput = z.input<typeof settingsSchema>;
export type SettingsFormValues = z.output<typeof settingsSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
export type LoginValues = z.infer<typeof loginSchema>;
