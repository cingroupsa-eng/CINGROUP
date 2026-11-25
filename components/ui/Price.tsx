import { cn, discountPercent, formatPYG } from "@/lib/utils";

export function Price({
  price,
  compareAt,
  className,
  size = "md",
}: {
  price: number;
  compareAt?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const off = discountPercent(price, compareAt ?? null);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-sans tabular-nums", className)}>
      <span
        className={cn(
          "font-semibold tracking-tight",
          off ? "text-maleja-deep" : "text-ink",
          { sm: "text-sm", md: "text-[15px]", lg: "text-2xl sm:text-[28px]" }[size]
        )}
      >
        {formatPYG(price)}
      </span>
      {off && (
        <>
          <span className={cn("text-ink-soft line-through", size === "lg" ? "text-base" : "text-xs")}>
            {formatPYG(compareAt!)}
          </span>
          {size === "lg" && (
            <span className="rounded-full bg-maleja-deep px-2 py-0.5 text-xs font-semibold text-white">-{off}%</span>
          )}
        </>
      )}
    </div>
  );
}
