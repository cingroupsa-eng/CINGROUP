"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import type { ProductWithRelations } from "@/lib/types";
import { Button, buttonStyles } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { useCart } from "@/components/cart/CartProvider";
import { useStore } from "@/components/store/StoreContext";
import { cn, formatPYG, sortSizes, waLink } from "@/lib/utils";

export function ProductPurchase({ product, url }: { product: ProductWithRelations; url: string }) {
  const { add, open } = useCart();
  const { settings } = useStore();
  const shake = useAnimationControls();

  const colors = useMemo(() => {
    const m = new Map<string, { name: string; hex: string; stock: number }>();
    product.variants.forEach((v) => {
      const prev = m.get(v.color_name);
      m.set(v.color_name, { name: v.color_name, hex: v.color_hex, stock: (prev?.stock ?? 0) + v.stock });
    });
    return Array.from(m.values());
  }, [product.variants]);

  const sizes = useMemo(() => sortSizes(Array.from(new Set(product.variants.map((v) => v.size)))), [product.variants]);

  const [color, setColor] = useState<string | null>(() => {
    const avail = colors.filter((c) => c.stock > 0);
    return avail.length === 1 ? avail[0].name : null;
  });
  const [pickedSize, setSize] = useState<string | null>(() => {
    const avail = sizes.filter((s) => product.variants.some((v) => v.size === s && v.stock > 0));
    return avail.length === 1 ? avail[0] : null;
  });
  const [pickedQty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const sizeAvailable = (s: string) =>
    product.variants.some((v) => v.size === s && v.stock > 0 && (!color || v.color_name === color));

  // Estado derivado en el render (sin efectos): una talla sin stock para el color elegido se deselecciona sola.
  const size = pickedSize && sizeAvailable(pickedSize) ? pickedSize : null;
  const variant = color && size ? product.variants.find((v) => v.color_name === color && v.size === size) ?? null : null;
  const stock = variant?.stock ?? 0;
  const qty = Math.max(1, Math.min(pickedQty, stock || 1));
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2200);
    return () => clearTimeout(t);
  }, [added]);

  const handleAdd = () => {
    if (!color) {
      setError("Elegí un color para continuar");
      shake.start({ x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.4 } });
      return;
    }
    if (!size) {
      setError("Elegí tu talla para continuar");
      shake.start({ x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.4 } });
      return;
    }
    if (!variant || variant.stock < 1) {
      setError("Esta combinación no tiene stock disponible");
      return;
    }
    setError(null);
    add({
      key: variant.id,
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0]?.url ?? null,
      size: variant.size,
      colorName: variant.color_name,
      colorHex: variant.color_hex,
      unitPrice: product.price_pyg,
      quantity: qty,
      maxStock: variant.stock,
    });
    setAdded(true);
    setTimeout(open, 350);
  };

  const consultText = `¡Hola! Me interesa esta prenda: *${product.name}* (${formatPYG(product.price_pyg)})${color ? ` · Color: ${color}` : ""}${size ? ` · Talla: ${size}` : ""}\n${url}`;

  return (
    <div className="space-y-7">
      {/* Color */}
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink">
          Color{color && <span className="ml-2 font-normal text-ink-soft">{color}</span>}
        </legend>
        <div className="flex flex-wrap gap-3">
          {colors.map((c) => {
            const disabled = c.stock <= 0;
            const active = color === c.name;
            return (
              <label
                key={c.name}
                title={c.name}
                className={cn(
                  "relative grid size-11 cursor-pointer place-items-center rounded-full transition-[box-shadow,transform] duration-200 ease-lux active:scale-[0.95]",
                  "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-maleja",
                  active ? "ring-2 ring-maleja ring-offset-[3px]" : "ring-1 ring-ink/10 hover:ring-2 hover:ring-maleja-pastel",
                  disabled && "cursor-not-allowed opacity-40"
                )}
              >
                <input
                  type="radio"
                  name={`color-${product.id}`}
                  value={c.name}
                  checked={active}
                  disabled={disabled}
                  onChange={() => {
                    setColor(c.name);
                    setError(null);
                  }}
                  aria-label={`${c.name}${disabled ? " (agotado)" : ""}`}
                  className="sr-only"
                />
                <span aria-hidden className="size-9 rounded-full ring-1 ring-inset ring-black/5" style={{ backgroundColor: c.hex }} />
                {disabled && <span aria-hidden className="absolute h-px w-11 rotate-45 bg-ink/50" />}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Talla */}
      <motion.fieldset animate={shake} aria-describedby={error ? "purchase-error" : undefined}>
        <legend className="mb-3 text-sm font-medium text-ink">
          Talla{size && <span className="ml-2 font-normal text-ink-soft">{size}</span>}
        </legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => {
            const available = sizeAvailable(s);
            const active = size === s;
            return (
              <label
                key={s}
                className={cn(
                  "relative grid min-h-[44px] min-w-[52px] cursor-pointer place-items-center rounded-full border px-4 text-sm font-medium",
                  "transition-[background-color,border-color,color,transform] duration-200 ease-lux active:scale-[0.96]",
                  "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-maleja",
                  active
                    ? "border-ink bg-ink text-white"
                    : available
                      ? "border-maleja-pastel/70 bg-white text-ink hover:border-maleja hover:text-maleja"
                      : "cursor-not-allowed border-dashed border-ink/15 bg-transparent text-ink-soft/50 line-through"
                )}
              >
                <input
                  type="radio"
                  name={`size-${product.id}`}
                  value={s}
                  checked={active}
                  disabled={!available}
                  onChange={() => {
                    setSize(s);
                    setError(null);
                  }}
                  aria-label={`Talla ${s}${available ? "" : " (sin stock)"}`}
                  className="sr-only"
                />
                <span aria-hidden>{s}</span>
              </label>
            );
          })}
        </div>
      </motion.fieldset>

      {/* Disponibilidad */}
      <div className="min-h-[24px] text-sm" aria-live="polite">
        {totalStock <= 0 ? (
          <span className="inline-flex items-center gap-2 font-medium text-ink-soft">
            <span className="size-2 rounded-full bg-ink-soft" /> Agotado por el momento
          </span>
        ) : variant ? (
          variant.stock > 0 ? (
            <span className="inline-flex items-center gap-2 font-medium text-ok">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-ok" />
              </span>
              {variant.stock <= 3 ? `¡Últimas ${variant.stock} unidades!` : "Disponible"}
            </span>
          ) : (
            <span className="font-medium text-ink-soft">Sin stock en esta combinación</span>
          )
        ) : (
          <span className="text-ink-soft">Elegí color y talla para ver disponibilidad.</span>
        )}
      </div>

      {/* Cantidad + agregar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex h-[52px] items-center justify-between rounded-full border border-maleja-pastel/70 bg-white sm:w-[140px]">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            disabled={qty <= 1}
            aria-label="Restar cantidad"
            className="grid h-[52px] w-12 place-items-center rounded-full text-ink transition hover:text-maleja disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
          <span className="text-base font-medium tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty(Math.min(stock || 1, qty + 1))}
            disabled={!variant || qty >= stock}
            aria-label="Sumar cantidad"
            className="grid h-[52px] w-12 place-items-center rounded-full text-ink transition hover:text-maleja disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <Button size="lg" className="flex-1" onClick={handleAdd} disabled={totalStock <= 0}>
          {added ? (
            <>
              <Check className="size-5" /> ¡Agregado a tu bolsa!
            </>
          ) : (
            <>
              <ShoppingBag className="size-5" strokeWidth={1.8} /> Agregar a la bolsa
            </>
          )}
        </Button>
      </div>

      {error && (
        <motion.p id="purchase-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alert" className="text-sm font-medium text-maleja">
          {error}
        </motion.p>
      )}

      {settings.whatsapp_number && (
        <a
          href={waLink(settings.whatsapp_number, consultText)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles("outline", "lg", "w-full !border-ok/30 !text-ok hover:!border-ok hover:!bg-ok/5")}
        >
          <WhatsAppIcon className="size-5" /> Consultar por WhatsApp
        </a>
      )}
    </div>
  );
}
