import type { Metadata } from "next";
import { getAdminContext } from "@/lib/auth";
import { PageHeader } from "@/components/admin/AdminShell";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import type { Brand, Category } from "@/lib/types";

export const metadata: Metadata = { title: "Categorías y marcas" };

export default async function CategoriesPage() {
  const ctx = (await getAdminContext())!;
  const [{ data: cats }, { data: brands }, { data: prods }] = await Promise.all([
    ctx.supabase.from("categories").select("*").order("display_order").order("name"),
    ctx.supabase.from("brands").select("*").order("name"),
    ctx.supabase.from("products").select("category_id"),
  ]);
  const counts = new Map<string, number>();
  (prods ?? []).forEach((p) => p.category_id && counts.set(p.category_id as string, (counts.get(p.category_id as string) ?? 0) + 1));
  const categories = ((cats ?? []) as Category[]).map((c) => ({ ...c, product_count: counts.get(c.id) ?? 0 }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Categorías y marcas" description="Ordená con las flechas. Las categorías desactivadas no se muestran en la tienda." />
      <CategoriesManager categories={categories} brands={(brands ?? []) as Brand[]} />
    </div>
  );
}
