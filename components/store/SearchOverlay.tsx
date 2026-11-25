"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDialogA11y } from "@/lib/hooks/useDialogA11y";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { useStore } from "./StoreContext";
import { Price } from "@/components/ui/Price";

interface Result {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAt: number | null;
  category: string | null;
  image: string | null;
}

export function SearchOverlay() {
  const { searchOpen } = useStore();
  return <AnimatePresence>{searchOpen && <SearchPanel />}</AnimatePresence>;
}

function SearchPanel() {
  const { setSearchOpen, categories } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setSearchOpen(false);
  useDialogA11y(true, panelRef, close, inputRef);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json = (await res.json()) as { results: Result[] };
        setResults(json.results ?? []);
      } catch {
        /* abortado */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    close();
    router.push(`/tienda?q=${encodeURIComponent(q.trim())}`);
  };

  return (
        <motion.div
          ref={panelRef}
          tabIndex={-1}
          data-dialog-panel=""
          className="fixed inset-0 z-search bg-maleja-canvas outline-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2, ease: "easeOut" } }}
          exit={{ opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }}
          role="dialog"
          aria-modal="true"
          aria-label="Buscar productos"
        >
          <motion.div
            initial={{ transform: "translateY(-12px)", opacity: 0 }}
            animate={{ transform: "translateY(0px)", opacity: 1 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="container-lux flex h-full max-w-3xl flex-col pt-[max(1rem,env(safe-area-inset-top))]"
          >
            <form onSubmit={submit} className="flex items-center gap-2 border-b border-ink/15 pb-2 pt-4">
              <Search className="size-5 shrink-0 text-maleja-deep" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="search"
                enterKeyHint="search"
                placeholder="¿Qué estás buscando?"
                aria-label="Buscar"
                className="h-14 w-full min-w-0 bg-transparent font-serif text-[26px] text-ink placeholder:text-ink-soft/50 focus:outline-none sm:text-4xl"
              />
              {loading && <Loader2 className="size-5 shrink-0 animate-spin text-ink-soft" />}
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar búsqueda"
                className="grid size-11 shrink-0 place-items-center rounded-full text-ink transition hover:bg-white"
              >
                <X className="size-5" />
              </button>
            </form>

            <p className="sr-only" role="status" aria-live="polite">
              {q.trim().length >= 2 && !loading ? `${results.length} resultado${results.length === 1 ? "" : "s"}` : ""}
            </p>
            <div className="no-scrollbar flex-1 overflow-y-auto pb-24 pt-6">
              {q.trim().length < 2 ? (
                <div>
                  <p className="eyebrow mb-4">Explorá por categoría</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <Link
                        key={c.id}
                        href={`/categoria/${c.slug}`}
                        onClick={close}
                        className="min-h-[44px] rounded-full border border-maleja-pastel/60 bg-white px-5 py-2.5 text-sm text-ink transition hover:border-maleja hover:text-maleja-deep"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div>
                  <ul className="divide-y divide-maleja-pastel/30">
                    {results.map((r, i) => (
                      <motion.li key={r.id} initial={{ opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ delay: i * 0.03, duration: 0.2, ease: "easeOut" }}>
                        <Link href={`/producto/${r.slug}`} onClick={close} className="group flex items-center gap-4 py-3">
                          <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                            {r.image ? (
                              <Image src={r.image} alt={r.name} fill sizes="64px" className="object-cover transition duration-500 group-hover:scale-105" />
                            ) : (
                              <span className="grid h-full place-items-center font-serif text-2xl italic text-maleja-pastel">M</span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            {r.category && <span className="block text-[11px] uppercase tracking-[0.18em] text-ink-soft">{r.category}</span>}
                            <span className="block truncate font-serif text-xl text-ink group-hover:text-maleja-deep">{r.name}</span>
                            <Price price={r.price} compareAt={r.compareAt} size="sm" />
                          </span>
                          <ArrowRight className="size-4 text-ink-soft transition group-hover:translate-x-1 group-hover:text-maleja-deep" />
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={submit}
                    className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-maleja-deep"
                  >
                    Ver todos los resultados <ArrowRight className="size-4" />
                  </button>
                </div>
              ) : !loading ? (
                <div className="py-12 text-center">
                  <p className="font-serif text-2xl italic text-ink">Sin resultados para “{q.trim()}”</p>
                  <p className="mt-2 text-sm text-ink-soft">Probá con otra palabra o explorá nuestras categorías.</p>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
  );
}
