"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { buttonStyles } from "@/components/ui/Button";
import { MonogramPaths } from "@/components/brand/Logo";
import { RotatingBadge } from "./RotatingBadge";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ settings }: { settings: StoreSettings }) {
  const title = settings.hero_title?.trim();
  const subtitle =
    settings.hero_subtitle?.trim() ||
    "Moda femenina seleccionada con dedicación para que cada prenda hable de vos. Descubrí, elegí y pedí por WhatsApp en minutos.";

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -right-32 top-10 h-[420px] w-[420px] rounded-full bg-maleja-pastel/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[320px] w-[320px] rounded-full bg-maleja-hot/10 blur-3xl" />

      <div className="container-lux relative grid items-center gap-10 pb-16 pt-8 sm:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-16">
        {/* Texto */}
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }} className="eyebrow">
            Boutique · Paraguay
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.08, ease }}
            className="heading-xl mt-5 text-ink"
          >
            {title ? (
              title
            ) : (
              <>
                Tu estilo,
                <br />
                <span className="relative inline-block italic text-maleja">
                  tu esencia.
                  <motion.svg
                    viewBox="0 0 300 20"
                    className="absolute -bottom-2 left-0 h-3 w-full text-maleja-pastel"
                    aria-hidden
                    initial={{ pathLength: 0 }}
                  >
                    <motion.path
                      d="M2 14 C 80 2, 180 2, 298 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2, delay: 0.7, ease }}
                    />
                  </motion.svg>
                </span>
              </>
            )}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="mx-auto mt-7 max-w-md text-[15px] leading-relaxed text-ink-soft sm:text-base lg:mx-0"
          >
            {subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Link href="/tienda?orden=recientes" className={buttonStyles("primary", "lg", "group w-full sm:w-auto")}>
              Ver novedades
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-lux group-hover:translate-x-1" />
            </Link>
            <Link href="/categoria/ofertas" className={buttonStyles("outline", "lg", "w-full sm:w-auto")}>
              Ofertas
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-10 hidden items-center gap-6 text-xs uppercase tracking-[0.2em] text-ink-soft lg:flex"
          >
            <span>Envíos a todo el país</span>
            <span className="h-px w-8 bg-maleja-pastel" />
            <span>Atención personalizada</span>
          </motion.div>
        </div>

        {/* Imagen editorial */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease }}
          className="relative order-1 mx-auto w-full max-w-[340px] sm:max-w-[440px] lg:order-2 lg:max-w-none"
        >
          <div className="relative mx-auto aspect-[4/5] w-[82%] overflow-hidden rounded-t-[999px] rounded-b-[36px] bg-gradient-to-b from-maleja-pastel/60 via-maleja-canvas to-white shadow-lift ring-1 ring-maleja-pastel/50 sm:w-[78%]">
            {settings.hero_image_url ? (
              <Image
                src={settings.hero_image_url}
                alt={`${settings.business_name} — nueva temporada`}
                fill
                priority
                sizes="(max-width: 1024px) 80vw, 40vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0">
                <div className="grain absolute inset-0" />
                <motion.div
                  className="absolute inset-x-[15%] top-[16%] h-[58%] rounded-t-[999px] border border-maleja/25"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-x-[24%] top-[25%] h-[49%] rounded-t-[999px] bg-gradient-to-b from-maleja-hot/30 to-maleja/5"
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <svg viewBox="0 0 100 100" className="absolute inset-x-[33%] top-[38%] aspect-square drop-shadow-sm" aria-hidden>
                  <MonogramPaths color="#F00072" />
                </svg>
                <p className="absolute inset-x-0 bottom-[10%] text-center font-serif text-2xl italic text-ink/70">Nueva temporada</p>
              </div>
            )}
          </div>

          <RotatingBadge
            id="hero"
            text="Tu estilo · Tu esencia · Maleja · "
            className="absolute -left-1 top-[6%] h-24 w-24 rounded-full bg-white/80 text-ink shadow-card backdrop-blur sm:left-0 sm:h-32 sm:w-32"
            center={<span className="font-serif text-3xl italic text-maleja">M</span>}
          />

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease }}
            className="absolute -right-1 bottom-[12%] flex items-center gap-3 rounded-2xl bg-white/90 p-3 pr-5 shadow-card ring-1 ring-maleja-pastel/40 backdrop-blur sm:right-0"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ok/10 text-ok">
              <WhatsAppIcon className="h-5 w-5" />
            </span>
            <span className="text-left">
              <span className="block text-[11px] uppercase tracking-[0.16em] text-ink-soft">Asesoría</span>
              <span className="block text-sm font-medium text-ink">Personalizada</span>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
