"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useStore } from "./StoreContext";
import { RotatingBadge } from "./RotatingBadge";
import { buttonStyles } from "@/components/ui/Button";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/SocialIcons";
import { MonogramPaths } from "@/components/brand/Logo";
import { cn, isSafeHttpUrl, waLink } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/** Estado vacío editorial: catálogo en preparación. */
export function EmptyCollection({ compact = false, title, subtitle }: { compact?: boolean; title?: string; subtitle?: string }) {
  const { settings } = useStore();
  const socials = [
    { url: settings.instagram_url, Icon: InstagramIcon, label: "Instagram" },
    { url: settings.facebook_url, Icon: FacebookIcon, label: "Facebook" },
    { url: settings.tiktok_url, Icon: TikTokIcon, label: "TikTok" },
  ].filter((s) => isSafeHttpUrl(s.url));

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-[32px] border border-maleja-pastel/40 bg-white",
        compact ? "px-6 py-14 sm:px-12" : "px-6 py-16 sm:px-12 sm:py-24"
      )}
    >
      {/* Fondo animado */}
      <motion.div
        aria-hidden
        className="absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-maleja-pastel/40 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-28 -right-20 -z-10 h-80 w-80 rounded-full bg-maleja-hot/15 blur-3xl"
        animate={{ x: [0, -24, 0], y: [0, -16, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div aria-hidden className="grain absolute inset-0 -z-10" />

      <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-[auto_1fr]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -8 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease }}
          className="mx-auto"
        >
          <RotatingBadge
            id="empty"
            text="Próximamente · Nueva colección · "
            className="h-44 w-44 text-maleja sm:h-52 sm:w-52"
            center={
              <svg viewBox="0 0 100 100" className="h-20 w-20 sm:h-24 sm:w-24" aria-hidden>
                <MonogramPaths color="#211820" />
              </svg>
            }
          />
        </motion.div>

        <div className="text-center md:text-left">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="eyebrow inline-flex items-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5" /> Colección en preparación
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="mt-4 font-serif text-[40px] font-medium leading-[1] tracking-tight text-ink sm:text-6xl"
          >
            {title ?? (
              <>
                Próximamente <span className="italic text-maleja">nuevas colecciones</span>
              </>
            )}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-ink-soft md:mx-0 sm:text-base"
          >
            {subtitle ??
              "Estamos preparando prendas exclusivas para vos. Seleccionamos cada pieza con amor para que encuentres tu estilo y tu esencia."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:items-start"
          >
            {settings.whatsapp_number ? (
              <a
                href={waLink(settings.whatsapp_number, "¡Hola! Quiero ser de las primeras en conocer la nueva colección ✨")}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles("whatsapp", "lg", "w-full sm:w-auto")}
              >
                <WhatsAppIcon className="h-5 w-5" /> Consultas VIP por WhatsApp
              </a>
            ) : (
              <span className={buttonStyles("soft", "lg", "pointer-events-none w-full cursor-default sm:w-auto")}>
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp muy pronto
              </span>
            )}
            {!compact && (
              <Link href="/tienda" className={buttonStyles("outline", "lg", "w-full sm:w-auto")}>
                Ver categorías
              </Link>
            )}
          </motion.div>

          {socials.length > 0 && (
            <div className="mt-8 flex items-center justify-center gap-3 md:justify-start">
              <span className="text-xs uppercase tracking-[0.2em] text-ink-soft">Seguinos</span>
              {socials.map(({ url, Icon, label }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-maleja-pastel/60 text-ink transition hover:border-maleja hover:bg-maleja hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
