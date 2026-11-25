"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { SORT_OPTIONS } from "@/lib/constants";
import { cn, formatThousands } from "@/lib/utils";

interface Options {
  sizes: string[];
  colors: { name: string; hex: string }[];
}

function useFilterState() {
  const sp = useSearchParams();
  const list = (k: string) => (sp.get(k) ? sp.get(k)!.split(",").filter(Boolean) : []);
  return {
    sizes: list("talla"),
    colors: list("color"),
    min: sp.get("min") ?? "",
    max: sp.get("max") ?? "",
    sort: sp.get("orden") ?? "recientes",
    q: sp.get("q") ?? "",
  };
}

function FilterBody({
  options,
  draft,
  setDraft,
}: {
  options: Options;
  draft: ReturnType<typeof useFilterState>;
  setDraft: (d: ReturnType<typeof useFilterState>) => void;
}) {
  const toggle = (key: "sizes" | "colors", v: string) =>
    setDraft({ ...draft, [key]: draft[key].includes(v) ? draft[key].filter((x) => x !== v) : [...draft[key], v] });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-3">Talla</p>
        {options.sizes.length ? (
          <div className="flex flex-wrap gap-2">
            {options.sizes.map((s) => {
              const on = draft.sizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle("sizes", s)}
                  aria-pressed={on}
                  className={cn(
                    "min-h-[44px] min-w-[44px] rounded-full border px-4 text-sm transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-lux",
                    on ? "border-ink bg-ink text-white" : "border-maleja-pastel/60 bg-white text-ink hover:border-maleja"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">Disponibles al publicar prendas.</p>
        )}
      </div>

      <div>
        <p className="eyebrow mb-3">Color</p>
        {options.colors.length ? (
          <div className="flex flex-wrap gap-3">
            {options.colors.map((c) => {
              const on = draft.colors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggle("colors", c.name)}
                  aria-pressed={on}
                  title={c.name}
                  className="flex min-h-[44px] flex-col items-center gap-1"
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-full ring-1 ring-ink/10 transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-lux",
                      on && "ring-2 ring-maleja ring-offset-2"
                    )}
                    style={{ backgroundColor: c.hex }}
                  >
                    {on && <Check className="size-4 text-white mix-blend-difference" />}
                  </span>
                  <span className="max-w-[64px] truncate text-[11px] text-ink-soft">{c.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">Disponibles al publicar prendas.</p>
        )}
      </div>

      <div>
        <p className="eyebrow mb-3">Precio (Gs.)</p>
        <div className="grid grid-cols-2 gap-3">
          {(["min", "max"] as const).map((k) => (
            <label key={k} className="block">
              <span className="mb-1 block text-xs text-ink-soft">{k === "min" ? "Desde" : "Hasta"}</span>
              <input
                inputMode="numeric"
                placeholder={k === "min" ? "0" : "Sin límite"}
                value={draft[k] ? formatThousands(Number(draft[k])) : ""}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                className="h-11 w-full rounded-2xl border border-maleja-pastel/60 bg-white px-3 text-[16px] tabular-nums focus:border-maleja focus:outline-none focus:ring-4 focus:ring-maleja/10 sm:text-sm"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CatalogFilters({ options, total }: { options: Options; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useFilterState();
  const [draft, setDraft] = useState(current);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();


  const apply = (d = draft) => {
    const p = new URLSearchParams();
    if (d.q) p.set("q", d.q);
    if (d.sizes.length) p.set("talla", d.sizes.join(","));
    if (d.colors.length) p.set("color", d.colors.join(","));
    if (d.min) p.set("min", d.min);
    if (d.max) p.set("max", d.max);
    if (d.sort && d.sort !== "recientes") p.set("orden", d.sort);
    startTransition(() => router.push(`${pathname}${p.toString() ? `?${p}` : ""}`, { scroll: false }));
    setOpen(false);
  };

  const activeCount = current.sizes.length + current.colors.length + (current.min ? 1 : 0) + (current.max ? 1 : 0);
  const clear = () => apply({ sizes: [], colors: [], min: "", max: "", sort: current.sort, q: current.q });

  return (
    <>
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-3 border-b border-maleja-pastel/40 pb-4">
        <p className={cn("whitespace-nowrap text-sm text-ink-soft transition-opacity", pending && "opacity-50")}>
          {total} {total === 1 ? "prenda" : "prendas"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-maleja-pastel/60 bg-white px-4 text-sm font-medium text-ink transition hover:border-maleja lg:hidden"
          >
            <SlidersHorizontal className="size-4" /> Filtrar
            {activeCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-maleja-deep px-1 text-[10px] text-white">{activeCount}</span>
            )}
          </button>
          <Select
            aria-label="Ordenar"
            value={current.sort}
            onChange={(e) => apply({ ...current, sort: e.target.value })}
            className="!h-11 !w-auto !rounded-full !py-0 !text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Chips activos */}
      {(activeCount > 0 || current.q) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {current.q && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs text-white">
              “{current.q}”
              <button type="button" aria-label="Quitar búsqueda" onClick={() => apply({ ...current, q: "" })} className="-mr-1 grid size-6 place-items-center">
                <X className="size-3" />
              </button>
            </span>
          )}
          {[...current.sizes.map((s) => ({ k: "sizes" as const, v: s, l: `Talla ${s}` })), ...current.colors.map((c) => ({ k: "colors" as const, v: c, l: c }))].map(
            (chip) => (
              <span key={chip.k + chip.v} className="inline-flex items-center gap-1 rounded-full bg-maleja-canvas px-3 py-1.5 text-xs text-ink ring-1 ring-maleja-pastel/60">
                {chip.l}
                <button
                  type="button"
                  aria-label={`Quitar ${chip.l}`}
                  onClick={() => apply({ ...current, [chip.k]: current[chip.k].filter((x) => x !== chip.v) })}
                  className="-mr-1 grid size-6 place-items-center"
                >
                  <X className="size-3" />
                </button>
              </span>
            )
          )}
          {(current.min || current.max) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-maleja-canvas px-3 py-1.5 text-xs text-ink ring-1 ring-maleja-pastel/60">
              Gs. {current.min ? formatThousands(Number(current.min)) : "0"} – {current.max ? formatThousands(Number(current.max)) : "∞"}
              <button type="button" aria-label="Quitar precio" onClick={() => apply({ ...current, min: "", max: "" })} className="-mr-1 grid size-6 place-items-center">
                <X className="size-3" />
              </button>
            </span>
          )}
          {activeCount > 0 && (
            <button type="button" onClick={clear} className="min-h-[32px] px-2 text-xs font-medium text-maleja-deep underline-offset-4 hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Mobile sheet */}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="bottom"
        title="Filtrar"
        labelledBy="filters-title"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDraft({ ...draft, sizes: [], colors: [], min: "", max: "" })}>
              Limpiar
            </Button>
            <Button className="flex-[2]" onClick={() => apply()}>
              Ver resultados
            </Button>
          </div>
        }
      >
        <div className="px-5 py-6">
          <FilterBody options={options} draft={draft} setDraft={setDraft} />
        </div>
      </Sheet>

    </>
  );
}

export function DesktopFilters({ options }: { options: Options }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useFilterState();
  const [draft, setDraft] = useState(current);

  const apply = (d: typeof draft) => {
    const p = new URLSearchParams();
    if (d.q) p.set("q", d.q);
    if (d.sizes.length) p.set("talla", d.sizes.join(","));
    if (d.colors.length) p.set("color", d.colors.join(","));
    if (d.min) p.set("min", d.min);
    if (d.max) p.set("max", d.max);
    if (d.sort && d.sort !== "recientes") p.set("orden", d.sort);
    router.push(`${pathname}${p.toString() ? `?${p}` : ""}`, { scroll: false });
  };

  return (
    <aside className="sticky top-36 hidden self-start lg:block">
      <FilterBody
        options={options}
        draft={draft}
        setDraft={(d) => {
          const priceChanged = d.min !== draft.min || d.max !== draft.max;
          setDraft(d);
          if (!priceChanged) apply(d);
        }}
      />
      <Button variant="dark" size="sm" className="mt-6 w-full" onClick={() => apply(draft)}>
        Aplicar precio
      </Button>
    </aside>
  );
}
