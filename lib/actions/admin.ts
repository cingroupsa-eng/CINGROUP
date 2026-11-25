"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthError, requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  brandSchema,
  categorySchema,
  productSchema,
  settingsSchema,
  type CategoryFormInput,
  type ProductFormInput,
  type SettingsFormInput,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

type Result<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof AuthError) return { ok: false, error: e.message };
  const msg = (e as { message?: string })?.message ?? "";
  if (msg.includes("duplicate key") && msg.includes("slug")) return { ok: false, error: "Ya existe un registro con ese enlace (slug)." };
  if (msg.includes("uq_variants_combo")) return { ok: false, error: "Hay variantes repetidas (misma talla y color)." };
  if (msg.includes("uq_variants_sku")) return { ok: false, error: "Uno de los SKU ya está en uso en otra prenda." };
  if (msg.includes("Stock insuficiente")) return { ok: false, error: msg.replace(/^.*?Stock/, "Stock") };
  if (process.env.NODE_ENV !== "production") console.error("[admin-action]", e);
  return { ok: false, error: msg ? `No se pudo guardar: ${msg}` : "Ocurrió un error inesperado. Intentá de nuevo." };
}

function revalidateStore() {
  revalidatePath("/", "layout");
}

async function uniqueSlug(
  table: "products" | "categories" | "brands",
  base: string,
  excludeId?: string
): Promise<string> {
  const { supabase } = await requireAdmin();
  const root = slugify(base) || "item";
  let candidate = root;
  for (let i = 2; i < 200; i++) {
    let q = supabase.from(table).select("id").eq("slug", candidate);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

function storagePathFromUrl(url: string): { bucket: string; path: string } | null {
  const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  return m ? { bucket: m[1], path: decodeURIComponent(m[2]) } : null;
}

async function removeStorageFiles(urls: string[]) {
  if (!urls.length) return;
  const { supabase } = await requireAdmin();
  const byBucket = new Map<string, string[]>();
  urls.forEach((u) => {
    const p = storagePathFromUrl(u);
    if (p) byBucket.set(p.bucket, [...(byBucket.get(p.bucket) ?? []), p.path]);
  });
  await Promise.all(Array.from(byBucket, ([bucket, paths]) => supabase.storage.from(bucket).remove(paths)));
}

// ─── Auth ─────────────────────────────────────────────────────
export async function signOut() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ─── Productos ────────────────────────────────────────────────
export async function saveProduct(input: ProductFormInput): Promise<Result<{ id: string; slug: string }>> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los campos marcados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const { supabase } = await requireAdmin();
    const v = parsed.data;
    const slug = await uniqueSlug("products", v.slug || v.name, v.id);

    const row = {
      name: v.name,
      slug,
      description: v.description,
      price_pyg: v.price_pyg,
      compare_at_price_pyg: v.compare_at_price_pyg,
      category_id: v.category_id,
      brand_id: v.brand_id,
      is_published: v.is_published,
      is_featured: v.is_featured,
      is_new: v.is_new,
      is_on_sale: v.is_on_sale || Boolean(v.compare_at_price_pyg),
    };

    let productId = v.id;
    let previousImages: string[] = [];

    if (productId) {
      const { data: prevImgs } = await supabase.from("product_images").select("url").eq("product_id", productId);
      previousImages = (prevImgs ?? []).map((i) => i.url as string);
      const { error } = await supabase.from("products").update(row).eq("id", productId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("products").insert(row).select("id").single();
      if (error) throw error;
      productId = data.id as string;
    }

    // Imágenes: reemplazo completo respetando el orden.
    const { error: delImgErr } = await supabase.from("product_images").delete().eq("product_id", productId);
    if (delImgErr) throw delImgErr;
    if (v.images.length) {
      const { error } = await supabase.from("product_images").insert(
        v.images.map((img, i) => ({ product_id: productId, url: img.url, alt_text: img.alt_text ?? v.name, display_order: i }))
      );
      if (error) throw error;
    }
    const keep = new Set(v.images.map((i) => i.url));
    await removeStorageFiles(previousImages.filter((u) => !keep.has(u))).catch(() => {});

    // Variantes: actualizar existentes, insertar nuevas, eliminar las quitadas.
    const { data: existing } = await supabase.from("product_variants").select("id").eq("product_id", productId);
    const existingIds = new Set((existing ?? []).map((e) => e.id as string));
    const incomingIds = new Set(v.variants.filter((x) => x.id).map((x) => x.id as string));
    const toDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));
    if (toDelete.length) {
      const { error } = await supabase.from("product_variants").delete().in("id", toDelete);
      if (error) throw error;
    }
    for (const va of v.variants) {
      const data = {
        product_id: productId,
        size: va.size,
        color_name: va.color_name,
        color_hex: va.color_hex.toUpperCase(),
        stock: va.stock,
        sku: va.sku,
      };
      const { error } =
        va.id && existingIds.has(va.id)
          ? await supabase.from("product_variants").update(data).eq("id", va.id)
          : await supabase.from("product_variants").insert(data);
      if (error) throw error;
    }

    revalidateStore();
    return { ok: true, data: { id: productId!, slug }, message: "Prenda guardada correctamente." };
  } catch (e) {
    return fail(e);
  }
}

export async function setProductFlag(
  id: string,
  flag: "is_published" | "is_featured",
  value: boolean
): Promise<Result> {
  try {
    z.string().uuid().parse(id);
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("products").update({ [flag]: value }).eq("id", id);
    if (error) throw error;
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProduct(id: string): Promise<Result> {
  try {
    z.string().uuid().parse(id);
    const { supabase } = await requireAdmin();
    const { data: imgs } = await supabase.from("product_images").select("url").eq("product_id", id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    await removeStorageFiles((imgs ?? []).map((i) => i.url as string)).catch(() => {});
    revalidateStore();
    return { ok: true, message: "Prenda eliminada." };
  } catch (e) {
    return fail(e);
  }
}

// ─── Categorías ───────────────────────────────────────────────
export async function saveCategory(input: CategoryFormInput): Promise<Result> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisá los campos.", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const { supabase } = await requireAdmin();
    const v = parsed.data;
    const slug = await uniqueSlug("categories", v.slug || v.name, v.id);
    const row = { name: v.name, slug, description: v.description, image_url: v.image_url, is_active: v.is_active };
    if (v.id) {
      const { error } = await supabase.from("categories").update(row).eq("id", v.id);
      if (error) throw error;
    } else {
      const { data: last } = await supabase
        .from("categories")
        .select("display_order")
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { error } = await supabase.from("categories").insert({ ...row, display_order: ((last?.display_order as number) ?? 0) + 1 });
      if (error) throw error;
    }
    revalidateStore();
    return { ok: true, message: "Categoría guardada." };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleCategory(id: string, is_active: boolean): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("categories").update({ is_active }).eq("id", id);
    if (error) throw error;
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function reorderCategories(orderedIds: string[]): Promise<Result> {
  try {
    z.array(z.string().uuid()).max(200).parse(orderedIds);
    const { supabase } = await requireAdmin();
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase.from("categories").update({ display_order: i + 1 }).eq("id", orderedIds[i]);
      if (error) throw error;
    }
    revalidateStore();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCategory(id: string): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
    if (count && count > 0) {
      return { ok: false, error: `No se puede eliminar: tiene ${count} prenda(s). Movelas a otra categoría o desactivala.` };
    }
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    revalidateStore();
    return { ok: true, message: "Categoría eliminada." };
  } catch (e) {
    return fail(e);
  }
}

// ─── Marcas ───────────────────────────────────────────────────
export async function saveBrand(input: { id?: string; name: string }): Promise<Result> {
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  try {
    const { supabase } = await requireAdmin();
    const v = parsed.data;
    const slug = await uniqueSlug("brands", v.name, v.id);
    const { error } = v.id
      ? await supabase.from("brands").update({ name: v.name, slug }).eq("id", v.id)
      : await supabase.from("brands").insert({ name: v.name, slug });
    if (error) throw error;
    revalidateStore();
    return { ok: true, message: "Marca guardada." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteBrand(id: string): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) throw error;
    revalidateStore();
    return { ok: true, message: "Marca eliminada." };
  } catch (e) {
    return fail(e);
  }
}

// ─── Pedidos ──────────────────────────────────────────────────
const statusSchema = z.enum(["pendiente", "confirmado", "preparando", "listo_entrega", "entregado", "cancelado"]);

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Result> {
  try {
    z.string().uuid().parse(id);
    statusSchema.parse(status);
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) throw error;
    revalidatePath("/admin", "layout");
    revalidateStore();
    return { ok: true, message: "Estado actualizado." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveOrderNotes(id: string, admin_notes: string): Promise<Result> {
  try {
    z.string().uuid().parse(id);
    const notes = z.string().max(2000).parse(admin_notes);
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("orders").update({ admin_notes: notes.trim() || null }).eq("id", id);
    if (error) throw error;
    revalidatePath(`/admin/pedidos/${id}`);
    return { ok: true, message: "Notas guardadas." };
  } catch (e) {
    return fail(e);
  }
}

// ─── Configuración ────────────────────────────────────────────
export async function saveSettings(input: SettingsFormInput): Promise<Result> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisá los campos marcados.", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const { supabase } = await requireAdmin();
    const v = parsed.data;
    const { error } = await supabase
      .from("store_settings")
      .update({
        ...v,
        payment_methods: v.payment_methods.map((p) => ({ ...p, details: p.details ?? "" })),
      })
      .eq("id", 1);
    if (error) throw error;
    revalidateStore();
    return { ok: true, message: "Configuración guardada." };
  } catch (e) {
    return fail(e);
  }
}
