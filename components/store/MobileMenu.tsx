"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Logo } from "@/components/brand/Logo";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/SocialIcons";
import { useStore } from "./StoreContext";
import { cn, isSafeHttpUrl, waLink } from "@/lib/utils";

export function MobileMenu() {
  const { menuOpen, setMenuOpen, categories, settings } = useStore();
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, setMenuOpen]);

  const socials = [
    { url: settings.instagram_url, Icon: InstagramIcon, label: "Instagram" },
    { url: settings.facebook_url, Icon: FacebookIcon, label: "Facebook" },
    { url: settings.tiktok_url, Icon: TikTokIcon, label: "TikTok" },
  ].filter((s) => isSafeHttpUrl(s.url));

  return (
    <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} side="left" title={<Logo size="sm" />} labelledBy="menu-title">
      <nav className="px-3 py-4" aria-label="Menú principal">
        <p className="eyebrow px-3 pb-2">Comprar</p>
        <ul>
          {[
            { href: "/", label: "Inicio" },
            { href: "/tienda", label: "Toda la tienda" },
          ].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={cn(
                  "flex min-h-[52px] items-center justify-between rounded-2xl px-3 font-serif text-[22px] transition hover:bg-maleja-canvas",
                  pathname === l.href && "text-maleja"
                )}
              >
                {l.label}
                <ChevronRight className="size-4 text-ink-soft" />
              </Link>
            </li>
          ))}
        </ul>

        <p className="eyebrow mt-6 px-3 pb-2">Categorías</p>
        <ul>
          {categories.map((c, i) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i + 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/categoria/${c.slug}`}
                className={cn(
                  "flex min-h-[48px] items-center justify-between rounded-2xl px-3 text-[15px] transition hover:bg-maleja-canvas",
                  pathname === `/categoria/${c.slug}` ? "font-medium text-maleja" : "text-ink",
                  c.slug === "ofertas" && "text-maleja"
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 font-serif text-sm italic text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                  {c.name}
                </span>
                <ChevronRight className="size-4 text-ink-soft" />
              </Link>
            </motion.li>
          ))}
        </ul>

        <div className="mx-3 mt-8 rounded-3xl bg-maleja-canvas p-5">
          <p className="font-serif text-xl italic text-ink">¿Necesitás ayuda?</p>
          <p className="mt-1 text-sm text-ink-soft">Te asesoramos con talles, colores y envíos.</p>
          {settings.whatsapp_number ? (
            <a
              href={waLink(settings.whatsapp_number, "¡Hola! Quisiera hacer una consulta 💕")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-ok px-5 text-sm font-medium text-white"
            >
              <WhatsAppIcon className="size-4" /> Escribinos
              <ArrowUpRight className="size-4" />
            </a>
          ) : (
            <p className="mt-3 text-xs italic text-ink-soft">WhatsApp en configuración.</p>
          )}
          {socials.length > 0 && (
            <div className="mt-4 flex gap-2">
              {socials.map(({ url, Icon, label }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-11 place-items-center rounded-full bg-white text-ink transition hover:text-maleja"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>
    </Sheet>
  );
}
