import { cn } from "@/lib/utils";

/**
 * Monograma "M" de estilo didone (trazos finos/gruesos) dibujado como
 * vectores puros: se ve idéntico en cualquier dispositivo y sirve para
 * generar los íconos PWA.
 */
export function MonogramPaths({ color = "currentColor" }: { color?: string }) {
  return (
    <g fill={color}>
      {/* serifas superiores */}
      <rect x="19" y="28.6" width="15.5" height="2.2" rx="0.6" />
      <rect x="66" y="28.6" width="16" height="2.2" rx="0.6" />
      {/* asta izquierda fina */}
      <rect x="24.6" y="29.5" width="2.6" height="40.5" />
      {/* diagonal gruesa */}
      <polygon points="24.6,29.5 34.2,29.5 52.4,66.5 49.2,72.6" />
      {/* diagonal fina */}
      <polygon points="49.2,72.6 51.6,72.6 72.6,29.5 70.2,29.5" />
      {/* asta derecha gruesa */}
      <rect x="70.2" y="29.5" width="8.6" height="40.5" />
      {/* serifas inferiores */}
      <rect x="19" y="69.2" width="14" height="2.2" rx="0.6" />
      <rect x="64.6" y="69.2" width="18.6" height="2.2" rx="0.6" />
      {/* destello */}
      <path d="M84 18 L85.4 21.6 L89 23 L85.4 24.4 L84 28 L82.6 24.4 L79 23 L82.6 21.6 Z" />
    </g>
  );
}

/** Isotipo compacto (panel admin, PWA, favicon). */
export function Isotype({ className, variant = "solid" }: { className?: string; variant?: "solid" | "outline" }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("shrink-0", className)} role="img" aria-label="El Bazar de Maleja">
      <defs>
        <linearGradient id="iso-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF4F9A" />
          <stop offset="100%" stopColor="#F00072" />
        </linearGradient>
      </defs>
      {variant === "solid" ? (
        <>
          <rect width="100" height="100" rx="28" fill="url(#iso-g)" />
          <MonogramPaths color="#FFFFFF" />
        </>
      ) : (
        <>
          <rect x="1.5" y="1.5" width="97" height="97" rx="27" fill="none" stroke="#F00072" strokeWidth="1.5" />
          <MonogramPaths color="#F00072" />
        </>
      )}
    </svg>
  );
}

/** Logotipo completo tipográfico (header / footer). */
export function Logo({
  className,
  tone = "dark",
  size = "md",
}: {
  className?: string;
  tone?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { top: "text-[8px]", main: "text-[22px]", gap: "gap-0" },
    md: { top: "text-[9px] sm:text-[10px]", main: "text-[26px] sm:text-[30px]", gap: "gap-0.5" },
    lg: { top: "text-[11px]", main: "text-[44px]", gap: "gap-1" },
  }[size];
  return (
    <span className={cn("inline-flex select-none flex-col items-center leading-none", sizes.gap, className)}>
      <span
        className={cn(
          "font-sans font-medium uppercase tracking-luxe",
          sizes.top,
          tone === "dark" ? "text-ink-soft" : "text-white/80"
        )}
      >
        El Bazar de
      </span>
      <span
        className={cn(
          "relative font-serif font-medium italic tracking-tight",
          sizes.main,
          tone === "dark" ? "text-ink" : "text-white"
        )}
      >
        Maleja
        <svg
          viewBox="0 0 10 10"
          aria-hidden
          className={cn("absolute -right-2.5 top-0 size-2", tone === "dark" ? "text-maleja" : "text-maleja-pastel")}
        >
          <path d="M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z" fill="currentColor" />
        </svg>
      </span>
      <span className="sr-only">EL BAZAR DE MALEJA</span>
    </span>
  );
}
