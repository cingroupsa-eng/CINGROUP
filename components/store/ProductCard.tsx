"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ProductWithRelations } from "@/lib/types";
import { Price } from "@/components/ui/Price";
import { cn, discountPercent } from "@/lib/utils";

export function ProductCard({ product, index = 0, priority }: { product: ProductWithRelations; index?: number; priority?: boolean }) {
  const [img1, img2] = product.images;
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const soldOut = totalStock <= 0;
  const off = discountPercent(product.price_pyg, product.compare_at_price_pyg);
  const colors = Array.from(new Map(product.variants.map((v) => [v.color_name, v.color_hex])).entries());

  return (
    <motion.article
      initial={{ opacity: 0, transform: "translateY(16px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.05, ease: [0.23, 1, 0.32, 1] }}
      className="group"
    >
      <Link href={`/producto/${product.slug}`} className="block" aria-label={product.name}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-white ring-1 ring-maleja-pastel/30">
          {img1 ? (
            <>
              <Image
                src={img1.url}
                alt={img1.alt_text || product.name}
                fill
                priority={priority}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={cn(
                  "object-cover transition-[transform,opacity] duration-500 ease-lux group-hover:scale-[1.03]",
                  img2 && "group-hover:opacity-0",
                  soldOut && "grayscale-[40%]"
                )}
              />
              {img2 && (
                <Image
                  src={img2.url}
                  alt={img2.alt_text || product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover opacity-0 transition-[transform,opacity] duration-500 ease-lux group-hover:scale-[1.03] group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-maleja-canvas to-maleja-pastel/30">
              <span className="font-serif text-6xl italic text-maleja-pastel">M</span>
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {off && <span className="rounded-full bg-maleja px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-white">-{off}%</span>}
            {!off && product.is_on_sale && (
              <span className="rounded-full bg-maleja px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-white">Oferta</span>
            )}
            {product.is_new && (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink backdrop-blur">
                Nuevo
              </span>
            )}
          </div>
          {soldOut && (
            <div className="absolute inset-x-3 bottom-3 rounded-full bg-ink/80 py-2 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-white backdrop-blur">
              Agotado
            </div>
          )}
          {!soldOut && (
            <div className="absolute inset-x-3 bottom-3 translate-y-3 rounded-full bg-white/90 py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-ink opacity-0 backdrop-blur transition-[transform,opacity] duration-300 ease-lux group-hover:translate-y-0 group-hover:opacity-100 max-lg:hidden">
              Ver prenda
            </div>
          )}
        </div>

        <div className="px-1 pt-3.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink-soft">
              {product.brand?.name || product.category?.name || " "}
            </p>
            {colors.length > 0 && (
              <div className="flex shrink-0 -space-x-1" aria-label={`${colors.length} colores`}>
                {colors.slice(0, 4).map(([name, hex]) => (
                  <span key={name} title={name} className="size-3 rounded-full ring-2 ring-white" style={{ backgroundColor: hex }} />
                ))}
                {colors.length > 4 && <span className="pl-2 text-[10px] text-ink-soft">+{colors.length - 4}</span>}
              </div>
            )}
          </div>
          <h3 className="mt-1 line-clamp-2 font-serif text-[19px] leading-snug text-ink transition-colors group-hover:text-maleja sm:text-xl">
            {product.name}
          </h3>
          <Price price={product.price_pyg} compareAt={product.compare_at_price_pyg} className="mt-1" />
        </div>
      </Link>
    </motion.article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductWithRelations[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} priority={i < priorityCount} />
      ))}
    </div>
  );
}
