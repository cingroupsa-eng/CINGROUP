import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { SIZE_ORDER } from "./constants";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: ["soft", "card", "lift"] }],
      tracking: [{ tracking: ["luxe"] }],
      ease: [{ ease: ["lux", "drawer"] }],
      z: [{ z: ["float", "header", "overlay", "search", "lightbox", "toast", "skip"] }],
    },
  },
});

/** Combina clases condicionales y resuelve conflictos de Tailwind (la última gana). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 150000 → "Gs. 150.000" (separador de miles con punto, sin decimales). */
export function formatPYG(value: number | null | undefined): string {
  const n = Math.round(Number(value) || 0);
  const sign = n < 0 ? "-" : "";
  return `${sign}Gs. ${Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/** Sólo el número formateado: 150000 → "150.000". */
export function formatThousands(value: number | null | undefined): string {
  const n = Math.round(Number(value) || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Normaliza un teléfono paraguayo a formato internacional sin "+":
 * "0981 123 456" → "595981123456", "+595 981-123456" → "595981123456".
 * Devuelve null si no es válido.
 */
export function normalizeParaguayPhone(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  let n = digits;
  if (n.startsWith("00595")) n = n.slice(2);
  if (n.startsWith("0")) n = "595" + n.slice(1);
  else if (!n.startsWith("595") && /^9\d{8}$/.test(n)) n = "595" + n;
  return /^595\d{8,10}$/.test(n) ? n : null;
}

/** "595981123456" → "+595 981 123 456" */
export function prettyPhone(n: string | null | undefined): string {
  if (!n) return "";
  const m = n.match(/^595(\d{3})(\d{3})(\d+)$/);
  return m ? `+595 ${m[1]} ${m[2]} ${m[3]}` : `+${n}`;
}

export function waLink(phone: string, text?: string): string {
  const base = `https://wa.me/${phone.replace(/\D/g, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function sizeRank(s: string): number {
  const i = SIZE_ORDER.indexOf(s.toUpperCase());
  if (i >= 0) return i;
  const num = parseFloat(s);
  return Number.isFinite(num) ? 100 + num : 1000;
}

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b));
}

export function discountPercent(price: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function formatDate(iso: string, withTime = true): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "America/Asuncion",
  }).format(d);
}

export function isSafeHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** "hace 5 min", "hace 2 h", "ayer", o la fecha corta. */
export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "recién";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return "ayer";
  return formatDate(iso, false);
}
