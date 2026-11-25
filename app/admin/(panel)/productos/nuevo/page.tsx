import type { Metadata } from "next";
import { getAdminContext } from "@/lib/auth";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Nueva prenda" };

export default async function NewProductPage() {
  const ctx = (await getAdminContext())!;
  const [{ data: categories }, { data: brands }] = await Promise.all([
    ctx.supabase.from("categories").select("id,name").order("display_order"),
    ctx.supabase.from("brands").select("id,name").order("name"),
  ]);
  return <ProductForm categories={categories ?? []} brands={brands ?? []} />;
}
