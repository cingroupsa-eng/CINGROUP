import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

const tints = [
  "from-maleja-pastel/50 to-white",
  "from-maleja-canvas to-maleja-pastel/40",
  "from-white to-maleja-pastel/30",
  "from-maleja-hot/15 to-maleja-canvas",
];

export function CategoryRail({ categories }: { categories: Category[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-5">
      {categories.map((c, i) => (
        <Reveal
          key={c.id}
          delay={(i % 5) * 0.05}
          className={cn("w-[42%] shrink-0 snap-start sm:w-[30%] md:w-auto", i === 0 && "lg:col-span-1")}
        >
          <Link
            href={`/categoria/${c.slug}`}
            className={cn(
              "group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-[22px] bg-gradient-to-br p-4 ring-1 ring-maleja-pastel/40 transition-[transform,box-shadow] duration-300 ease-lux hover:-translate-y-1 hover:shadow-card sm:p-5",
              c.slug === "ofertas" ? "from-maleja-deep to-maleja text-white ring-0" : tints[i % tints.length]
            )}
          >
            {c.image_url && (
              <>
                <Image
                  src={c.image_url}
                  alt={c.name}
                  fill
                  sizes="(max-width: 768px) 45vw, 20vw"
                  className="object-cover transition-transform duration-700 ease-lux group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
              </>
            )}
            <span
              className={cn(
                "relative font-serif text-sm italic",
                c.image_url ? "text-white/80" : c.slug === "ofertas" ? "text-white/80" : "text-ink-soft"
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="relative flex items-end justify-between gap-2">
              <span
                className={cn(
                  "font-serif text-[22px] leading-none sm:text-[26px]",
                  c.image_url || c.slug === "ofertas" ? "text-white" : "text-ink"
                )}
              >
                {c.name}
              </span>
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full transition-transform duration-300 ease-lux group-hover:rotate-45",
                  c.image_url || c.slug === "ofertas" ? "bg-white/20 text-white backdrop-blur" : "bg-white text-maleja-deep"
                )}
              >
                <ArrowUpRight className="size-4" />
              </span>
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
