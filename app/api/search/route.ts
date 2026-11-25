import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("q") ?? "";
  const term = raw.replace(/[%_,()*\\]/g, " ").trim().slice(0, 60);
  const sb = getPublicSupabase();
  if (!sb || term.length < 2) return NextResponse.json({ results: [] });

  const { data, error } = await sb
    .from("products")
    .select("id, name, slug, price_pyg, compare_at_price_pyg, category:categories(name), images:product_images(url, display_order)")
    .eq("is_published", true)
    .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) return NextResponse.json({ results: [] }, { status: 200 });

  const results = (data ?? []).map((p) => {
    const imgs = ((p.images as { url: string; display_order: number }[] | null) ?? []).sort(
      (a, b) => a.display_order - b.display_order
    );
    const cat = p.category as unknown as { name: string } | null;
    return {
      id: p.id as string,
      name: p.name as string,
      slug: p.slug as string,
      price: p.price_pyg as number,
      compareAt: (p.compare_at_price_pyg as number | null) ?? null,
      category: cat?.name ?? null,
      image: imgs[0]?.url ?? null,
    };
  });

  return NextResponse.json({ results }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
