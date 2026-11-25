"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

const swipeThreshold = 60;

export function ProductGallery({ images, name, badges }: { images: ProductImage[]; name: string; badges?: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const count = images.length;

  const go = useCallback(
    (next: number) => {
      if (!count) return;
      setDir(next > index ? 1 : -1);
      setIndex((next + count) % count);
    },
    [count, index]
  );

  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, go, index]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -swipeThreshold || info.velocity.x < -500) go(index + 1);
    else if (info.offset.x > swipeThreshold || info.velocity.x > 500) go(index - 1);
  };

  if (!count) {
    return (
      <div className="relative grid aspect-[3/4] place-items-center overflow-hidden rounded-[28px] bg-gradient-to-br from-maleja-canvas to-maleja-pastel/40">
        <span className="font-serif text-8xl italic text-maleja-pastel">M</span>
        <div className="absolute left-4 top-4">{badges}</div>
      </div>
    );
  }

  const current = images[index];

  return (
    <div className="lg:grid lg:grid-cols-[84px_1fr] lg:gap-4">
      {/* Miniaturas desktop */}
      {count > 1 && (
        <div className="no-scrollbar hidden max-h-[720px] flex-col gap-3 overflow-y-auto lg:flex">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-2xl ring-1 transition-all duration-300 ease-lux",
                i === index ? "ring-2 ring-maleja" : "opacity-70 ring-maleja-pastel/40 hover:opacity-100"
              )}
            >
              <Image src={img.url} alt={img.alt_text || `${name} ${i + 1}`} fill sizes="84px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <div
          className="group relative aspect-[3/4] touch-pan-y overflow-hidden rounded-[28px] bg-white ring-1 ring-maleja-pastel/30 lg:cursor-zoom-in"
          onMouseMove={(e) => {
            if (window.matchMedia("(hover: none)").matches) return;
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={current.id}
              custom={dir}
              initial={{ x: dir >= 0 ? "100%" : "-100%", opacity: 0.4 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir >= 0 ? "-100%" : "100%", opacity: 0.4 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              drag={count > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={onDragEnd}
              onTap={() => setLightbox(true)}
              className="absolute inset-0"
            >
              <Image
                src={current.url}
                alt={current.alt_text || name}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                draggable={false}
                className="select-none object-cover transition-transform duration-300 ease-out"
                style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%`, transform: "scale(1.9)" } : undefined}
              />
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none absolute left-4 top-4 z-10">{badges}</div>

          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="Ampliar foto"
            className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/85 text-ink backdrop-blur transition hover:text-maleja lg:opacity-0 lg:group-hover:opacity-100"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink opacity-0 backdrop-blur transition group-hover:opacity-100 lg:grid"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label="Foto siguiente"
                className="absolute right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink opacity-0 backdrop-blur transition group-hover:opacity-100 lg:grid"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-1.5 lg:hidden">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Foto ${i + 1}`}
                    className="grid h-6 place-items-center px-0.5"
                  >
                    <span className={cn("block h-1.5 rounded-full transition-all duration-300", i === index ? "w-6 bg-white" : "w-1.5 bg-white/60")} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Miniaturas mobile */}
        {count > 1 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ver foto ${i + 1}`}
                className={cn(
                  "relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-xl ring-1 transition",
                  i === index ? "ring-2 ring-maleja" : "opacity-70 ring-maleja-pastel/40"
                )}
              >
                <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col bg-ink/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Fotos de ${name}`}
          >
            <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] text-white">
              <span className="text-sm tabular-nums text-white/70">
                {index + 1} / {count}
              </span>
              <button type="button" onClick={() => setLightbox(false)} aria-label="Cerrar" className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="relative flex-1 overflow-auto">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                drag={count > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={onDragEnd}
                className="relative mx-auto h-full w-full max-w-4xl touch-pinch-zoom"
              >
                <Image src={current.url} alt={current.alt_text || name} fill sizes="100vw" className="object-contain" quality={90} />
              </motion.div>
            </div>
            {count > 1 && (
              <div className="flex justify-center gap-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
                <button type="button" onClick={() => go(index - 1)} aria-label="Anterior" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => go(index + 1)} aria-label="Siguiente" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
