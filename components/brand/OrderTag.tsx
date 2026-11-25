import { cn } from "@/lib/utils";

/**
 * Firma visual de la marca: el número de pedido como etiqueta colgante
 * de boutique (muesca + orificio). Se usa en panel, listados y confirmación.
 */
export function OrderTag({
  number,
  tone = "ink",
  size = "sm",
  className,
}: {
  number: string;
  tone?: "ink" | "soft" | "fuchsia";
  size?: "sm" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center font-sans font-semibold tabular-nums",
        size === "sm" ? "h-6 pl-[18px] pr-2.5 text-[11.5px] tracking-[0.06em]" : "h-9 pl-7 pr-4 text-base tracking-[0.08em]",
        size === "sm"
          ? "[clip-path:polygon(9px_0,100%_0,100%_100%,9px_100%,0_50%)] rounded-r-[5px]"
          : "[clip-path:polygon(14px_0,100%_0,100%_100%,14px_100%,0_50%)] rounded-r-lg",
        {
          ink: "bg-ink text-white",
          soft: "bg-maleja-pastel/45 text-ink",
          fuchsia: "bg-maleja-deep text-white",
        }[tone],
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute rounded-full bg-white ring-1 ring-black/5",
          size === "sm" ? "left-[8px] size-[5px]" : "left-[12px] size-2"
        )}
      />
      <span className="sr-only">Pedido </span>
      {number}
    </span>
  );
}
