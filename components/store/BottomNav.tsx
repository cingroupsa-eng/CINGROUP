"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { useStore } from "./StoreContext";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { count, open, hydrated, isOpen } = useCart();
  const { setSearchOpen, setMenuOpen, menuOpen, searchOpen } = useStore();

  const item = "relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10.5px] font-medium tracking-wide";

  return (
    <nav
      aria-label="Navegación inferior"
      className="fixed inset-x-0 bottom-0 z-header border-t border-maleja-pastel/40 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        <Link href="/" className={cn(item, pathname === "/" ? "text-maleja" : "text-ink-soft")}>
          {pathname === "/" && <motion.span layoutId="bn-dot" className="absolute top-1 size-1 rounded-full bg-maleja" />}
          <Home className="size-[21px]" strokeWidth={1.6} />
          Inicio
        </Link>
        <button type="button" onClick={() => setMenuOpen(true)} aria-haspopup="dialog" aria-expanded={menuOpen} className={cn(item, pathname.startsWith("/categoria") ? "text-maleja" : "text-ink-soft")}>
          <LayoutGrid className="size-[21px]" strokeWidth={1.6} />
          Categorías
        </button>
        <button type="button" onClick={() => setSearchOpen(true)} aria-haspopup="dialog" aria-expanded={searchOpen} className={cn(item, "text-ink-soft")}>
          <Search className="size-[21px]" strokeWidth={1.6} />
          Buscar
        </button>
        <Link href="/tienda" className={cn(item, pathname.startsWith("/tienda") || pathname.startsWith("/producto") ? "text-maleja" : "text-ink-soft")}>
          {pathname.startsWith("/tienda") && <motion.span layoutId="bn-dot" className="absolute top-1 size-1 rounded-full bg-maleja" />}
          <svg viewBox="0 0 24 24" className="size-[21px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M8.5 3 6 5.2 3 6.5l1.4 4 2.1-.6V21h11V9.9l2.1.6 1.4-4-3-1.3L15.5 3c-.6 1.5-1.9 2.4-3.5 2.4S9.1 4.5 8.5 3Z" strokeLinejoin="round" />
          </svg>
          Tienda
        </Link>
        <button type="button" onClick={open} aria-haspopup="dialog" aria-expanded={isOpen} className={cn(item, "text-ink-soft")} aria-label={`Bolsa${count ? `, ${count} artículos` : ""}`}>
          <span className="relative">
            <ShoppingBag className="size-[21px]" strokeWidth={1.6} />
            {hydrated && count > 0 && (
              <motion.span
                key={count}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", duration: 0.35, bounce: 0.3 }}
                className="absolute -right-2.5 -top-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-maleja px-1 text-[9.5px] font-semibold text-white"
              >
                {count}
              </motion.span>
            )}
          </span>
          Bolsa
        </button>
      </div>
    </nav>
  );
}
