"use client";

import { useOptimistic, useTransition } from "react";
import { Star } from "lucide-react";
import { setProductFlag } from "@/lib/actions/admin";
import { useToast } from "./Toast";
import { cn } from "@/lib/utils";

export function PublishToggle({ id, value }: { id: string; value: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(value);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={optimistic ? "Ocultar de la tienda" : "Publicar en la tienda"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          const r = await setProductFlag(id, "is_published", !optimistic);
          if (!r.ok) toast("error", r.error);
          else toast("success", !optimistic ? "Prenda publicada ✨" : "Prenda oculta de la tienda");
        })
      }
      className="flex min-h-[44px] items-center gap-2"
    >
      <span className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300", optimistic ? "bg-ok" : "bg-ink/15")}>
        <span className={cn("inline-block size-[18px] rounded-full bg-white shadow transition-transform duration-300 ease-lux", optimistic ? "translate-x-[22px]" : "translate-x-[3px]")} />
      </span>
      <span className={cn("text-xs font-medium", optimistic ? "text-ok" : "text-ink-soft")}>{optimistic ? "Publicada" : "Oculta"}</span>
    </button>
  );
}

export function FeaturedToggle({ id, value }: { id: string; value: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(value);
  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? "Quitar de destacados" : "Marcar como destacada"}
      title={optimistic ? "Destacada" : "Marcar como destacada"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          const r = await setProductFlag(id, "is_featured", !optimistic);
          if (!r.ok) toast("error", r.error);
        })
      }
      className="grid size-11 place-items-center rounded-full transition hover:bg-maleja-canvas"
    >
      <Star className={cn("size-[18px]", optimistic ? "fill-maleja text-maleja" : "text-ink-soft")} />
    </button>
  );
}
