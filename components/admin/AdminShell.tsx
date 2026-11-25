"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, ExternalLink, FolderTree, LayoutDashboard, LogOut, Package, Settings } from "lucide-react";
import { Isotype } from "@/components/brand/Logo";
import { ToastProvider } from "./Toast";
import { signOut } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Inicio", Icon: LayoutDashboard, exact: true },
  { href: "/admin/pedidos", label: "Pedidos", Icon: ClipboardList },
  { href: "/admin/productos", label: "Productos", Icon: Package },
  { href: "/admin/categorias", label: "Categorías", Icon: FolderTree },
  { href: "/admin/configuracion", label: "Configuración", Icon: Settings },
];

export function AdminShell({
  children,
  userName,
  pendingCount,
}: {
  children: React.ReactNode;
  userName: string;
  pendingCount: number;
}) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-[#FBF6F8] lg:grid lg:grid-cols-[264px_1fr]">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-maleja-pastel/40 bg-white px-4 py-6 lg:flex">
          <Link href="/admin" className="flex items-center gap-3 px-2">
            <Isotype className="h-10 w-10" />
            <span className="leading-tight">
              <span className="block font-serif text-xl italic text-ink">Maleja</span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-ink-soft">Panel de gestión</span>
            </span>
          </Link>
          <nav className="mt-10 flex flex-1 flex-col gap-1">
            {nav.map(({ href, label, Icon, exact }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-2xl px-3 text-sm font-medium transition-all duration-300 ease-lux",
                  isActive(href, exact) ? "bg-maleja text-white shadow-soft" : "text-ink hover:bg-maleja-canvas hover:text-maleja"
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                {label}
                {href === "/admin/pedidos" && pendingCount > 0 && (
                  <span
                    className={cn(
                      "ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-semibold",
                      isActive(href) ? "bg-white text-maleja" : "bg-maleja text-white"
                    )}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="space-y-1 border-t border-maleja-pastel/40 pt-4">
            <a href="/" target="_blank" rel="noopener" className="flex min-h-[44px] items-center gap-3 rounded-2xl px-3 text-sm text-ink-soft transition hover:bg-maleja-canvas hover:text-ink">
              <ExternalLink className="h-4 w-4" /> Ver tienda
            </a>
            <form action={signOut}>
              <button className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 text-sm text-ink-soft transition hover:bg-maleja-canvas hover:text-ink">
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </form>
            <p className="truncate px-3 pt-2 text-[11px] text-ink-soft/70">{userName}</p>
          </div>
        </aside>

        {/* Top bar mobile */}
        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-maleja-pastel/40 bg-white/85 px-4 backdrop-blur-xl lg:hidden">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Isotype className="h-8 w-8" />
              <span className="font-serif text-lg italic">Maleja</span>
            </Link>
            <div className="flex items-center">
              <a href="/" target="_blank" rel="noopener" aria-label="Ver tienda" className="grid h-11 w-11 place-items-center rounded-full text-ink-soft">
                <ExternalLink className="h-[18px] w-[18px]" />
              </a>
              <form action={signOut}>
                <button aria-label="Cerrar sesión" className="grid h-11 w-11 place-items-center rounded-full text-ink-soft">
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </form>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>
        </div>

        {/* Bottom nav mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-maleja-pastel/40 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          <div className="flex">
            {nav.map(({ href, label, Icon, exact }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium",
                  isActive(href, exact) ? "text-maleja" : "text-ink-soft"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.8} />
                {label === "Configuración" ? "Ajustes" : label}
                {href === "/admin/pedidos" && pendingCount > 0 && (
                  <span className="absolute right-[calc(50%-18px)] top-2 grid h-4 min-w-4 place-items-center rounded-full bg-maleja px-1 text-[9px] font-semibold text-white">
                    {pendingCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </ToastProvider>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl font-medium text-ink sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
