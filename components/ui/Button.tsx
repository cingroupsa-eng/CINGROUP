import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "dark" | "outline" | "ghost" | "soft" | "whatsapp" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

export const buttonStyles = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(
    "relative inline-flex items-center justify-center gap-2 rounded-full font-sans font-medium select-none",
    // Feedback de interacción: propiedades explícitas, 160 ms, ease-out fuerte.
    "transition-[transform,background-color,border-color,color,box-shadow,filter] duration-press ease-lux active:scale-[0.97]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maleja/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    "disabled:pointer-events-none disabled:opacity-50",
    {
      primary: "bg-maleja text-white shadow-sm hover:bg-maleja-hot",
      dark: "bg-ink text-white hover:bg-maleja",
      outline: "border border-ink/15 bg-white text-ink hover:border-maleja hover:text-maleja",
      ghost: "text-ink hover:bg-maleja-canvas hover:text-maleja",
      soft: "bg-maleja-canvas text-maleja ring-1 ring-maleja-pastel/50 hover:bg-maleja-pastel/30",
      whatsapp: "bg-ok text-white shadow-sm hover:brightness-110",
      danger: "bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50",
    }[variant],
    {
      sm: "min-h-[36px] px-4 text-[13px]",
      md: "min-h-[44px] px-6 text-sm",
      lg: "min-h-[52px] px-8 text-[15px] tracking-wide",
      icon: "size-11",
    }[size],
    className
  );

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, ...props },
  ref
) {
  return (
    <button ref={ref} className={buttonStyles(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
