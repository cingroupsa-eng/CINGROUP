"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useFieldArray, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Layers, Plus, Trash2, Wand2 } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/Field";
import { ImageUploader } from "./ImageUploader";
import { PriceInput } from "./PriceInput";
import { useToast } from "./Toast";
import { deleteProduct, saveProduct } from "@/lib/actions/admin";
import { productSchema, type ProductFormInput, type ProductFormValues } from "@/lib/validations";
import { SIZE_PRESETS } from "@/lib/constants";
import type { Brand, Category, ProductWithRelations } from "@/lib/types";
import { cn, discountPercent, formatPYG, slugify } from "@/lib/utils";

const COLOR_PRESETS = [
  { name: "Negro", hex: "#111111" },
  { name: "Blanco", hex: "#FFFFFF" },
  { name: "Beige", hex: "#E8D8C3" },
  { name: "Rosa", hex: "#FFB6D0" },
  { name: "Fucsia", hex: "#F00072" },
  { name: "Rojo", hex: "#C8102E" },
  { name: "Azul", hex: "#1F3A93" },
  { name: "Celeste", hex: "#9CC9F5" },
  { name: "Verde", hex: "#2E7D4F" },
  { name: "Marrón", hex: "#7B4B2A" },
  { name: "Gris", hex: "#9E9E9E" },
  { name: "Dorado", hex: "#C9A54C" },
];

function Card({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl bg-white p-5 ring-1 ring-maleja-pastel/40 sm:p-6", className)}>
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function firstError(errors: FieldErrors<ProductFormInput>): string | null {
  const walk = (e: unknown): string | null => {
    if (!e || typeof e !== "object") return null;
    const o = e as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    for (const k of Object.keys(o)) {
      if (k === "ref") continue;
      const r = walk(o[k]);
      if (r) return r;
    }
    return null;
  };
  return walk(errors);
}

export function ProductForm({
  product,
  categories,
  brands,
}: {
  product?: ProductWithRelations;
  categories: Pick<Category, "id" | "name">[];
  brands: Pick<Brand, "id" | "name">[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [bulk, setBulk] = useState({ color: "", hex: "#111111", sizes: [] as string[], stock: 1 });
  const [showBulk, setShowBulk] = useState(!product);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: product?.id,
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      price_pyg: product?.price_pyg ?? ("" as unknown as number),
      compare_at_price_pyg: product?.compare_at_price_pyg ?? null,
      category_id: product?.category_id ?? "",
      brand_id: product?.brand_id ?? "",
      is_published: product?.is_published ?? false,
      is_featured: product?.is_featured ?? false,
      is_new: product?.is_new ?? true,
      is_on_sale: product?.is_on_sale ?? false,
      images: product?.images.map((i) => ({ url: i.url, alt_text: i.alt_text ?? "" })) ?? [],
      variants:
        product?.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color_name: v.color_name,
          color_hex: v.color_hex,
          stock: v.stock,
          sku: v.sku ?? "",
        })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const price = Number(watch("price_pyg")) || 0;
  const compareAt = Number(watch("compare_at_price_pyg")) || 0;
  const name = watch("name");
  const off = discountPercent(price, compareAt || null);
  const totalStock = (watch("variants") ?? []).reduce((s, v) => s + (Number(v.stock) || 0), 0);

  const addBulk = () => {
    if (!bulk.color.trim()) return toast("error", "Escribí el nombre del color.");
    if (!bulk.sizes.length) return toast("error", "Elegí al menos una talla.");
    const existing = new Set(getValues("variants").map((v) => `${v.size.toLowerCase()}|${v.color_name.toLowerCase()}`));
    let added = 0;
    bulk.sizes.forEach((s) => {
      if (existing.has(`${s.toLowerCase()}|${bulk.color.trim().toLowerCase()}`)) return;
      append({ id: "", size: s, color_name: bulk.color.trim(), color_hex: bulk.hex, stock: bulk.stock, sku: "" });
      added++;
    });
    toast("success", added ? `${added} variante(s) agregada(s).` : "Esas combinaciones ya existían.");
    setBulk((b) => ({ ...b, sizes: [] }));
  };

  const onSubmit = () => {
    start(async () => {
      const res = await saveProduct(getValues());
      if (!res.ok) {
        if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([k, v]) => v?.[0] && setError(k as keyof ProductFormInput, { message: v[0] }));
        }
        toast("error", res.error);
        return;
      }
      toast("success", res.message ?? "Guardado.");
      if (!product && res.data) router.replace(`/admin/productos/${res.data.id}`);
      else router.refresh();
    });
  };

  const onInvalid = (errs: FieldErrors<ProductFormInput>) => {
    toast("error", firstError(errs) ?? "Revisá los campos marcados.");
  };

  const onDelete = () => {
    if (!product) return;
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    startDelete(async () => {
      const r = await deleteProduct(product.id);
      if (!r.ok) return toast("error", r.error);
      toast("success", "Prenda eliminada.");
      router.replace("/admin/productos");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/admin/productos" aria-label="Volver" className="grid h-11 w-11 place-items-center rounded-full bg-white ring-1 ring-maleja-pastel/40 hover:text-maleja">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">{product ? "Editar prenda" : "Nueva prenda"}</h1>
            {product && <p className="text-xs text-ink-soft">/{product.slug}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {product?.is_published && (
            <a href={`/producto/${product.slug}`} target="_blank" rel="noopener" className={buttonStyles("outline", "md")}>
              <ExternalLink className="h-4 w-4" /> Ver en tienda
            </a>
          )}
          <Button type="submit" loading={pending} className="hidden sm:inline-flex">
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card title="Información">
            <div className="space-y-4">
              <Field label="Nombre de la prenda" htmlFor="name" required error={errors.name?.message}>
                <Input
                  id="name"
                  placeholder="Ej.: Vestido midi satinado"
                  invalid={!!errors.name}
                  {...register("name", {
                    onBlur: (e) => {
                      if (!product && !getValues("slug")) setValue("slug", slugify(e.target.value));
                    },
                  })}
                />
              </Field>
              <Field label="Descripción" htmlFor="description" hint="Tela, calce, cuidados, recomendaciones de uso…" error={errors.description?.message}>
                <Textarea id="description" rows={5} {...register("description")} />
              </Field>
              <Field
                label="Enlace (slug)"
                htmlFor="slug"
                hint={`Se usa en la dirección web: /producto/${watch("slug") || slugify(name || "") || "…"}`}
                error={errors.slug?.message}
              >
                <Input
                  id="slug"
                  placeholder="se-genera-automaticamente"
                  invalid={!!errors.slug}
                  {...register("slug", { setValueAs: (v: string) => slugify(v ?? "") })}
                />
              </Field>
            </div>
          </Card>

          <Card title="Fotos" description="La primera foto es la portada. Usá fotos verticales (3:4) para un look editorial.">
            <Controller control={control} name="images" render={({ field }) => <ImageUploader value={field.value} onChange={field.onChange} />} />
            {errors.images?.message && <p className="mt-2 text-xs text-red-600">{errors.images.message}</p>}
          </Card>

          <Card title="Tallas, colores y stock" description="Cada combinación talla + color tiene su propio stock. Sin stock = no se puede pedir.">
            <div className="rounded-2xl bg-maleja-canvas p-4">
              <button type="button" onClick={() => setShowBulk((s) => !s)} className="flex min-h-[40px] w-full items-center gap-2 text-left text-sm font-medium text-maleja">
                <Wand2 className="h-4 w-4" /> Carga rápida: un color con varias tallas
              </button>
              <AnimatePresence initial={false}>
                {showBulk && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="space-y-4 pt-3">
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setBulk((b) => ({ ...b, color: c.name, hex: c.hex }))}
                            className={cn(
                              "inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white px-3 text-xs ring-1",
                              bulk.color === c.name ? "ring-maleja" : "ring-maleja-pastel/50"
                            )}
                          >
                            <span className="h-3.5 w-3.5 rounded-full ring-1 ring-ink/10" style={{ backgroundColor: c.hex }} />
                            {c.name}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-[1fr_auto_96px] gap-2">
                        <Input placeholder="Nombre del color" value={bulk.color} onChange={(e) => setBulk((b) => ({ ...b, color: e.target.value }))} />
                        <input
                          type="color"
                          aria-label="Elegir color"
                          value={bulk.hex}
                          onChange={(e) => setBulk((b) => ({ ...b, hex: e.target.value.toUpperCase() }))}
                          className="h-[50px] w-[50px] cursor-pointer rounded-2xl border border-maleja-pastel/60 bg-white p-1"
                        />
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          aria-label="Stock por talla"
                          placeholder="Stock"
                          value={bulk.stock}
                          onChange={(e) => setBulk((b) => ({ ...b, stock: Math.max(0, parseInt(e.target.value || "0", 10)) }))}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {SIZE_PRESETS.map((s) => {
                          const on = bulk.sizes.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setBulk((b) => ({ ...b, sizes: on ? b.sizes.filter((x) => x !== s) : [...b.sizes, s] }))}
                              className={cn(
                                "min-h-[40px] min-w-[44px] rounded-full px-3 text-sm ring-1 transition",
                                on ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-maleja-pastel/60"
                              )}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                      <Button type="button" variant="dark" size="sm" onClick={addBulk}>
                        <Layers className="h-4 w-4" /> Agregar variantes
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <datalist id="size-presets">
              {SIZE_PRESETS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>

            <ul className="mt-4 space-y-3">
              <AnimatePresence initial={false}>
                {fields.map((f, i) => {
                  const e = errors.variants?.[i];
                  return (
                    <motion.li
                      key={f.id}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-2xl border border-maleja-pastel/50 p-3"
                    >
                      <input type="hidden" {...register(`variants.${i}.id`)} />
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[90px_1fr_56px_90px_1fr_44px] sm:items-start">
                        <Field error={e?.size?.message}>
                          <Input list="size-presets" placeholder="Talla" aria-label="Talla" invalid={!!e?.size} {...register(`variants.${i}.size`)} />
                        </Field>
                        <Field error={e?.color_name?.message}>
                          <Input placeholder="Color" aria-label="Nombre del color" invalid={!!e?.color_name} {...register(`variants.${i}.color_name`)} />
                        </Field>
                        <Controller
                          control={control}
                          name={`variants.${i}.color_hex`}
                          render={({ field }) => (
                            <input
                              type="color"
                              aria-label="Color"
                              value={field.value}
                              onChange={(ev) => field.onChange(ev.target.value.toUpperCase())}
                              className="h-[50px] w-full cursor-pointer rounded-2xl border border-maleja-pastel/60 bg-white p-1"
                            />
                          )}
                        />
                        <Field error={e?.stock?.message}>
                          <Input type="number" inputMode="numeric" min={0} placeholder="Stock" aria-label="Stock" invalid={!!e?.stock} {...register(`variants.${i}.stock`)} />
                        </Field>
                        <Input placeholder="SKU (opcional)" aria-label="SKU" className="col-span-2 sm:col-span-1" {...register(`variants.${i}.sku`)} />
                        <button
                          type="button"
                          onClick={() => remove(i)}
                          aria-label="Eliminar variante"
                          className="col-span-2 grid h-11 place-items-center rounded-2xl text-red-600 ring-1 ring-red-100 transition hover:bg-red-50 sm:col-span-1 sm:h-[50px]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
            {errors.variants?.message && <p className="mt-2 text-xs font-medium text-red-600">{errors.variants.message}</p>}
            {errors.variants?.root?.message && <p className="mt-2 text-xs font-medium text-red-600">{errors.variants.root.message}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="soft"
                size="sm"
                onClick={() => append({ id: "", size: "", color_name: "", color_hex: "#111111", stock: 0, sku: "" })}
              >
                <Plus className="h-4 w-4" /> Agregar variante
              </Button>
              <p className="text-sm text-ink-soft">
                Stock total: <strong className="text-ink">{totalStock}</strong> unidades
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-5 lg:sticky lg:top-8 lg:self-start">
          <Card title="Visibilidad">
            <div className="divide-y divide-maleja-pastel/30">
              {(
                [
                  ["is_published", "Publicada", "Visible en la tienda"],
                  ["is_new", "Nuevo", "Etiqueta «Nuevo» y sección Novedades"],
                  ["is_featured", "Destacada", "Aparece en «Nuestras favoritas»"],
                  ["is_on_sale", "En oferta", "Aparece en la sección Ofertas"],
                ] as const
              ).map(([key, label, desc]) => (
                <Controller
                  key={key}
                  control={control}
                  name={key}
                  render={({ field }) => <Switch id={key} checked={!!field.value} onChange={field.onChange} label={label} description={desc} />}
                />
              ))}
            </div>
          </Card>

          <Card title="Precio">
            <div className="space-y-4">
              <Field label="Precio de venta" htmlFor="price" required error={errors.price_pyg?.message}>
                <Controller
                  control={control}
                  name="price_pyg"
                  render={({ field }) => <PriceInput id="price" value={field.value as number} onChange={(v) => field.onChange(v ?? "")} invalid={!!errors.price_pyg} />}
                />
              </Field>
              <Field label="Precio anterior (opcional)" htmlFor="compare" hint="Si es mayor al precio de venta se muestra tachado." error={errors.compare_at_price_pyg?.message}>
                <Controller
                  control={control}
                  name="compare_at_price_pyg"
                  render={({ field }) => (
                    <PriceInput id="compare" value={field.value as number | null} onChange={field.onChange} invalid={!!errors.compare_at_price_pyg} placeholder="Sin descuento" />
                  )}
                />
              </Field>
              {price > 0 && (
                <div className="rounded-2xl bg-maleja-canvas p-3 text-sm">
                  <span className="text-ink-soft">Así se verá: </span>
                  <strong className={off ? "text-maleja" : "text-ink"}>{formatPYG(price)}</strong>
                  {off && (
                    <>
                      <span className="ml-2 text-ink-soft line-through">{formatPYG(compareAt)}</span>
                      <span className="ml-2 rounded-full bg-maleja px-2 py-0.5 text-xs font-semibold text-white">-{off}%</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card title="Organización">
            <div className="space-y-4">
              <Field label="Categoría" htmlFor="category" required error={errors.category_id?.message}>
                <Select id="category" invalid={!!errors.category_id} {...register("category_id")}>
                  <option value="">Elegí una categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Marca (opcional)" htmlFor="brand" hint={<Link href="/admin/categorias#marcas" className="text-maleja">Gestionar marcas</Link>}>
                <Select id="brand" {...register("brand_id")}>
                  <option value="">Sin marca</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          {product && (
            <Button type="button" variant="danger" className="w-full" onClick={onDelete} loading={deleting}>
              <Trash2 className="h-4 w-4" /> Eliminar prenda
            </Button>
          )}
        </div>
      </div>

      <div className="h-20 sm:hidden" aria-hidden />
      {/* Barra de guardado móvil */}
      <div className="fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom))] z-20 border-t border-maleja-pastel/40 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
        <Button type="submit" loading={pending} className="w-full">
          {isDirty || !product ? "Guardar prenda" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
