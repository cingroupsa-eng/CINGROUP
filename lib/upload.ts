"use client";

import { getBrowserSupabase } from "./supabase/client";

/** Redimensiona y comprime en el navegador (máx. 1800px, WebP) antes de subir. */
export async function compressImage(file: File, maxSize = 1800, quality = 0.86): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", quality));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export async function uploadImage(bucket: "products" | "branding", file: File, folder = ""): Promise<string> {
  if (file.size > 15 * 1024 * 1024) throw new Error(`"${file.name}" supera 15 MB.`);
  if (!/^image\/(jpeg|png|webp|avif|svg\+xml)$/.test(file.type)) throw new Error(`"${file.name}" no es una imagen compatible (JPG, PNG, WebP).`);
  const blob = await compressImage(file);
  const ext = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() || "jpg").toLowerCase();
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${folder ? `${folder}/` : ""}${id}.${ext}`;
  const sb = getBrowserSupabase();
  const { error } = await sb.storage.from(bucket).upload(path, blob, {
    cacheControl: "31536000",
    contentType: blob.type || file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message.includes("row-level security") ? "No tenés permisos para subir archivos." : error.message);
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
