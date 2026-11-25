import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getAdminContext } from "@/lib/auth";
import { ProductForm } from "@/components/admin/ProductForm";
import { normalizeProduct, PRODUCT_SELECT } from "@/lib/data";

export const metadata: Metadata = { title: "Editar prenda" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const ctx = (await getAdminContext())!;
  const [{ data: product }, { data: categories }, { data: brands }] = await Promise.all([
    ctx.supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle(),
    ctx.supabase.from("categories").select("id,name").order("display_order"),
    ctx.supabase.from("brands").select("id,name").order("name"),
  ]);
  if (!product) notFound();
  const p = normalizeProduct(product);
  return <ProductForm key={p.updated_at} product={p} categories={categories ?? []} brands={brands ?? []} />;
}
