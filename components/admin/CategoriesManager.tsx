"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Field, Input, Switch, Textarea } from "@/components/ui/Field";
import { SingleImageUpload } from "./ImageUploader";
import { useToast } from "./Toast";
import { deleteBrand, deleteCategory, reorderCategories, saveBrand, saveCategory, toggleCategory } from "@/lib/actions/admin";
import { categorySchema, type CategoryFormInput, type CategoryFormValues } from "@/lib/validations";
import type { Brand, Category } from "@/lib/types";
import { cn } from "@/lib/utils";

type CatWithCount = Category & { product_count: number };

function CategoryForm({ initial, onDone }: { initial?: CatWithCount | null; onDone: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: initial?.id,
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      image_url: initial?.image_url ?? "",
      is_active: initial?.is_active ?? true,
    },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(() =>
        start(async () => {
          const r = await saveCategory(getValues());
          if (!r.ok) return toast("error", r.error);
          toast("success", r.message ?? "Guardado");
          router.refresh();
          onDone();
        })
      )}
      className="space-y-4 px-5 py-6"
    >
      <Field label="Nombre" htmlFor="cat-name" required error={errors.name?.message}>
        <Input id="cat-name" invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field label="Enlace (slug)" htmlFor="cat-slug" hint="Se genera automáticamente si lo dejás vacío." error={errors.slug?.message}>
        <Input id="cat-slug" {...register("slug")} />
      </Field>
      <Field label="Descripción" htmlFor="cat-desc" error={errors.description?.message}>
        <Textarea id="cat-desc" rows={2} {...register("description")} />
      </Field>
      <Field label="Imagen (opcional)">
        <Controller
          control={control}
          name="image_url"
          render={({ field }) => (
            <SingleImageUpload value={field.value} onChange={(u) => field.onChange(u ?? "")} bucket="branding" folder="categorias" aspect="aspect-[3/4]" />
          )}
        />
      </Field>
      <Controller
        control={control}
        name="is_active"
        render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label="Activa" description="Visible en la tienda y el menú" />}
      />
      <Button type="submit" className="w-full" loading={pending}>
        Guardar categoría
      </Button>
    </form>
  );
}

export function CategoriesManager({ categories: initial, brands }: { categories: CatWithCount[]; brands: Brand[] }) {
  const toast = useToast();
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<CatWithCount | null | undefined>(undefined);
  const [, start] = useTransition();
  const [brandName, setBrandName] = useState("");
  const [brandEdit, setBrandEdit] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => setItems(initial), [initial]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    start(async () => {
      const r = await reorderCategories(next.map((c) => c.id));
      if (!r.ok) {
        toast("error", r.error);
        setItems(initial);
      }
    });
  };

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Categorías</h2>
          <Button size="sm" onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Nueva
          </Button>
        </div>
        <ul className="space-y-2">
          {items.map((c, i) => (
            <motion.li layout key={c.id} className="flex items-center gap-3 rounded-3xl bg-white p-3 ring-1 ring-maleja-pastel/40">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir" className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-maleja-canvas disabled:opacity-20">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Bajar" className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-maleja-canvas disabled:opacity-20">
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
              <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-xl bg-maleja-canvas">
                {c.image_url ? (
                  <Image src={c.image_url} alt="" fill sizes="44px" className="object-cover" />
                ) : (
                  <span className="grid h-full place-items-center font-serif text-lg italic text-maleja-pastel">{c.name[0]}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate font-medium", !c.is_active && "text-ink-soft line-through")}>{c.name}</p>
                <p className="truncate text-xs text-ink-soft">
                  /{c.slug} · {c.product_count} prenda(s)
                </p>
              </div>
              <Switch
                checked={c.is_active}
                onChange={(v) => {
                  setItems((xs) => xs.map((x) => (x.id === c.id ? { ...x, is_active: v } : x)));
                  start(async () => {
                    const r = await toggleCategory(c.id, v);
                    if (!r.ok) toast("error", r.error);
                    router.refresh();
                  });
                }}
              />
              <button type="button" onClick={() => setEditing(c)} aria-label={`Editar ${c.name}`} className="grid h-11 w-11 place-items-center rounded-full hover:bg-maleja-canvas hover:text-maleja">
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Eliminar ${c.name}`}
                onClick={() => {
                  if (!confirm(`¿Eliminar la categoría "${c.name}"?`)) return;
                  start(async () => {
                    const r = await deleteCategory(c.id);
                    if (!r.ok) return toast("error", r.error);
                    toast("success", r.message ?? "Eliminada");
                    router.refresh();
                  });
                }}
                className="hidden h-11 w-11 place-items-center rounded-full text-red-600 hover:bg-red-50 sm:grid"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.li>
          ))}
        </ul>
      </section>

      <section id="marcas">
        <h2 className="mb-1 font-serif text-2xl">Marcas</h2>
        <p className="mb-4 text-sm text-ink-soft">Opcional. Si una prenda tiene marca, se muestra sobre su nombre.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await saveBrand({ name: brandName });
              if (!r.ok) return toast("error", r.error);
              setBrandName("");
              toast("success", r.message ?? "Guardada");
              router.refresh();
            });
          }}
          className="mb-4 flex gap-2"
        >
          <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Nombre de la marca" aria-label="Nombre de la marca" />
          <Button type="submit" variant="dark" disabled={brandName.trim().length < 2}>
            Agregar
          </Button>
        </form>
        {brands.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-maleja-pastel bg-white px-6 py-8 text-center text-sm text-ink-soft">Todavía no cargaste marcas.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <li key={b.id} className="flex items-center gap-1 rounded-full bg-white py-1 pl-4 pr-1 text-sm ring-1 ring-maleja-pastel/50">
                {brandEdit?.id === b.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      start(async () => {
                        const r = await saveBrand(brandEdit);
                        if (!r.ok) return toast("error", r.error);
                        setBrandEdit(null);
                        router.refresh();
                      });
                    }}
                  >
                    <input
                      autoFocus
                      value={brandEdit.name}
                      onChange={(e) => setBrandEdit({ ...brandEdit, name: e.target.value })}
                      onBlur={() => setBrandEdit(null)}
                      className="w-32 bg-transparent text-[16px] focus:outline-none sm:text-sm"
                    />
                  </form>
                ) : (
                  <button type="button" onClick={() => setBrandEdit({ id: b.id, name: b.name })} className="min-h-[36px]">
                    {b.name}
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Eliminar ${b.name}`}
                  onClick={() => {
                    if (!confirm(`¿Eliminar la marca "${b.name}"? Las prendas quedarán sin marca.`)) return;
                    start(async () => {
                      const r = await deleteBrand(b.id);
                      if (!r.ok) return toast("error", r.error);
                      router.refresh();
                    });
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? "Editar categoría" : "Nueva categoría"} labelledBy="cat-form">
        {editing !== undefined && <CategoryForm key={editing?.id ?? "new"} initial={editing} onDone={() => setEditing(undefined)} />}
        {editing && (
          <div className="px-5 pb-8">
            <p className="text-xs text-ink-soft">Para eliminar una categoría, primero mové sus prendas a otra.</p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
