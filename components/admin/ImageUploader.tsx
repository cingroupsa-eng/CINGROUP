"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { uploadImage } from "@/lib/upload";
import { useToast } from "./Toast";
import { cn } from "@/lib/utils";

export interface UploadedImage {
  url: string;
  alt_text?: string | null;
}

export function ImageUploader({
  value,
  onChange,
  max = 12,
  folder = "products",
}: {
  value: UploadedImage[];
  onChange: (v: UploadedImage[]) => void;
  max?: number;
  folder?: string;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(0);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const room = max - value.length;
    if (!list.length) return;
    if (room <= 0) {
      toast("error", `Máximo ${max} fotos por prenda.`);
      return;
    }
    const batch = list.slice(0, room);
    setUploading(batch.length);
    const results: UploadedImage[] = [];
    for (const f of batch) {
      try {
        const url = await uploadImage("products", f, folder);
        results.push({ url, alt_text: "" });
      } catch (e) {
        toast("error", (e as Error).message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (results.length) {
      onChange([...value, ...results]);
      toast("success", `${results.length} foto(s) subida(s).`);
    }
    if (list.length > room) toast("error", `Se subieron sólo ${room} fotos (máximo ${max}).`);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-lux",
          dragging ? "scale-[1.01] border-maleja bg-maleja-canvas" : "border-maleja-pastel/70 bg-white hover:border-maleja hover:bg-maleja-canvas/50"
        )}
      >
        {uploading > 0 ? (
          <Loader2 className="size-8 animate-spin text-maleja-deep" />
        ) : (
          <UploadCloud className="size-8 text-maleja-deep" strokeWidth={1.5} />
        )}
        <p className="mt-3 text-sm font-medium text-ink">
          {uploading > 0 ? `Subiendo ${uploading} foto(s)…` : "Arrastrá tus fotos aquí o tocá para elegirlas"}
        </p>
        <p className="mt-1 text-xs text-ink-soft">JPG, PNG o WebP · Se optimizan automáticamente · Máx. {max} fotos</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence initial={false}>
            {value.map((img, i) => (
              <motion.li
                key={img.url}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="overflow-hidden rounded-2xl bg-white ring-1 ring-maleja-pastel/50"
              >
                <div className="relative aspect-[3/4]">
                  <Image src={img.url} alt={img.alt_text || ""} fill sizes="200px" className="object-cover" />
                  {i === 0 && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-maleja-deep px-2 py-0.5 text-[10px] font-semibold text-white">
                      <Star className="size-3 fill-white" /> Portada
                    </span>
                  )}
                  <div className="absolute inset-x-2 bottom-2 flex justify-between">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Mover a la izquierda" className="grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow disabled:opacity-30">
                        <ArrowLeft className="size-4" />
                      </button>
                      <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label="Mover a la derecha" className="grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow disabled:opacity-30">
                        <ArrowRight className="size-4" />
                      </button>
                    </div>
                    <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Eliminar foto" className="grid size-9 place-items-center rounded-full bg-white/90 text-red-600 shadow">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <input
                  value={img.alt_text ?? ""}
                  onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, alt_text: e.target.value } : x)))}
                  placeholder="Descripción (opcional)"
                  maxLength={160}
                  className="w-full border-t border-maleja-pastel/40 px-3 py-2 text-[16px] focus:outline-none sm:text-xs"
                />
              </motion.li>
            ))}
          </AnimatePresence>
          {value.length < max && (
            <li>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="grid aspect-[3/4] w-full place-items-center rounded-2xl border-2 border-dashed border-maleja-pastel/70 text-maleja-deep transition hover:border-maleja hover:bg-maleja-canvas"
              >
                <ImagePlus className="size-6" />
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Subida de una sola imagen (logo, portada, categoría). */
export function SingleImageUpload({
  value,
  onChange,
  bucket = "branding",
  folder = "",
  aspect = "aspect-[4/5]",
  label = "Subir imagen",
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  bucket?: "branding" | "products";
  folder?: string;
  aspect?: string;
  label?: string;
}) {
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const upload = async (file?: File) => {
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadImage(bucket, file, folder);
      onChange(url);
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files[0]);
        }}
        className={cn(
          "relative w-32 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-maleja-pastel/70 bg-white transition hover:border-maleja",
          aspect
        )}
      >
        {value ? (
          <Image src={value} alt="" fill sizes="128px" className="object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-maleja-deep">
            {loading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          </span>
        )}
        {loading && value && (
          <span className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="size-6 animate-spin text-maleja-deep" />
          </span>
        )}
      </button>
      <div className="space-y-2 pt-1">
        <button type="button" onClick={() => ref.current?.click()} className="min-h-[40px] rounded-full bg-maleja-canvas px-4 text-sm font-medium text-maleja-deep ring-1 ring-maleja-pastel/60">
          {value ? "Cambiar" : label}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="block min-h-[36px] text-xs text-red-600">
            Quitar imagen
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
