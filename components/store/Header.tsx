"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { useCart } from "@/components/cart/CartProvider";
import { useStore } from "./StoreContext";
import { cn, waLink } from "@/lib/utils";

export function CartButton({ className }: { className?: string }) {
  const { count, open, hydrated, lastAddedAt } = useCart();
  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Abrir bolsa de compras${count ? `, ${count} artículos` : ""}`}
      className={cn(
        "relative grid h-11 w-11 place-items-center rounded-full text-ink transition hover:bg-maleja-canvas hover:text-maleja",
        className
      )}
    >
      <motion.span key={lastAddedAt} initial={lastAddedAt ? { scale: 0.7, rotate: -12 } : false} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
        <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.6} />
      </motion.span>
      <AnimatePresence>
        {hydrated && count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0, y: 4 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 20 }}
            className="absolute right-0.5 top-0.5 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-maleja px-1 text-[10px] font-semibold text-white ring-2 ring-white"
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export function Header() {
  const { categories, settings, setMenuOpen, setSearchOpen } = useStore();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navCats = categories.slice(0, 9);

  return (
    <>
      <div className="relative z-40 bg-ink text-center text-[11px] font-medium uppercase tracking-[0.22em] text-white/90">
        <div className="container-lux flex h-8 items-center justify-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="hidden sm:inline">Envíos a todo Paraguay</span>
          <span className="hidden text-maleja-pastel sm:inline">✦</span>
          <span>Pedidos y atención por WhatsApp</span>
        </div>
      </div>
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-all duration-300 ease-lux",
          scrolled
            ? "border-maleja-pastel/40 bg-white/75 shadow-[0_8px_30px_-18px_rgba(33,24,32,0.25)] backdrop-blur-xl backdrop-saturate-150"
            : "border-transparent bg-maleja-canvas/70 backdrop-blur-md"
        )}
      >
        <div className="container-lux grid h-16 grid-cols-[1fr_auto_1fr] items-center sm:h-[72px]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              className="grid h-11 w-11 place-items-center rounded-full text-ink transition hover:bg-maleja-canvas hover:text-maleja lg:hidden"
            >
              <Menu className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </button>
            <nav className="hidden items-center gap-7 text-[13px] font-medium uppercase tracking-[0.16em] lg:flex">
              <Link href="/tienda" className={cn("link-underline py-2", pathname === "/tienda" && "text-maleja")}>
                Tienda
              </Link>
              <Link href="/tienda?orden=recientes" className="link-underline py-2">
                Novedades
              </Link>
              <Link href="/categoria/ofertas" className="link-underline py-2 text-maleja">
                Ofertas
              </Link>
            </nav>
          </div>

          <Link href="/" aria-label="Ir al inicio" className="px-2">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt={settings.business_name} className="h-11 w-auto max-w-[180px] object-contain sm:h-12" />
            ) : (
              <Logo size="md" />
            )}
          </Link>

          <div className="flex items-center justify-end gap-0.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar productos"
              className="grid h-11 w-11 place-items-center rounded-full text-ink transition hover:bg-maleja-canvas hover:text-maleja"
            >
              <Search className="h-[21px] w-[21px]" strokeWidth={1.6} />
            </button>
            {settings.whatsapp_number && (
              <a
                href={waLink(settings.whatsapp_number, "¡Hola! Quisiera hacer una consulta 💕")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Escribinos por WhatsApp"
                className="hidden h-11 w-11 place-items-center rounded-full text-ok transition hover:bg-ok/10 sm:grid"
              >
                <WhatsAppIcon className="h-[21px] w-[21px]" />
              </a>
            )}
            <CartButton />
          </div>
        </div>

        <nav
          aria-label="Categorías"
          className="no-scrollbar hidden overflow-x-auto border-t border-maleja-pastel/25 lg:block"
        >
          <ul className="container-lux flex h-11 items-center justify-center gap-8 text-[12px] font-medium uppercase tracking-[0.2em] text-ink-soft">
            {navCats.map((c) => {
              const active = pathname === `/categoria/${c.slug}`;
              return (
                <li key={c.id}>
                  <Link
                    href={`/categoria/${c.slug}`}
                    className={cn(
                      "link-underline whitespace-nowrap py-2 transition-colors hover:text-ink",
                      active && "text-maleja",
                      c.slug === "ofertas" && "text-maleja"
                    )}
                  >
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
    </>
  );
}
