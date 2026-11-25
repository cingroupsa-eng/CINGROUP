"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Category, StoreSettings } from "@/lib/types";

interface StoreCtx {
  settings: StoreSettings;
  categories: Category[];
  menuOpen: boolean;
  searchOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({
  settings,
  categories,
  children,
}: {
  settings: StoreSettings;
  categories: Category[];
  children: ReactNode;
}) {
  const [menuOpen, setMenu] = useState(false);
  const [searchOpen, setSearch] = useState(false);
  const setMenuOpen = useCallback((v: boolean) => setMenu(v), []);
  const setSearchOpen = useCallback((v: boolean) => setSearch(v), []);
  const value = useMemo(
    () => ({ settings, categories, menuOpen, searchOpen, setMenuOpen, setSearchOpen }),
    [settings, categories, menuOpen, searchOpen, setMenuOpen, setSearchOpen]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return v;
}
