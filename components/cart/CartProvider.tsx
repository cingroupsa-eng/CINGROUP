"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "ebm-cart-v1";

type State = { items: CartItem[]; hydrated: boolean };
type Action =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; item: CartItem }
  | { type: "setQty"; key: string; quantity: number }
  | { type: "remove"; key: string }
  | { type: "clear" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { items: action.items, hydrated: true };
    case "add": {
      const existing = state.items.find((i) => i.key === action.item.key);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.key === action.item.key
              ? {
                  ...i,
                  ...action.item,
                  quantity: Math.min(i.quantity + action.item.quantity, action.item.maxStock),
                }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: Math.min(action.item.quantity, action.item.maxStock) }] };
    }
    case "setQty":
      return {
        ...state,
        items: state.items
          .map((i) => (i.key === action.key ? { ...i, quantity: Math.max(0, Math.min(action.quantity, i.maxStock)) } : i))
          .filter((i) => i.quantity > 0),
      };
    case "remove":
      return { ...state, items: state.items.filter((i) => i.key !== action.key) };
    case "clear":
      return { ...state, items: [] };
  }
}

interface CartContextValue {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  total: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (item: CartItem) => void;
  setQty: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  lastAddedAt: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function isValidItem(i: unknown): i is CartItem {
  const x = i as CartItem;
  return (
    !!x &&
    typeof x.key === "string" &&
    typeof x.variantId === "string" &&
    typeof x.name === "string" &&
    Number.isInteger(x.quantity) &&
    x.quantity > 0 &&
    Number.isInteger(x.unitPrice)
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false });
  const [isOpen, setOpen] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);

  useEffect(() => {
    let items: CartItem[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) items = parsed.filter(isValidItem);
    } catch {
      /* almacenamiento no disponible */
    }
    dispatch({ type: "hydrate", items });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* ignorar */
    }
  }, [state.items, state.hydrated]);

  // Sincroniza entre pestañas.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : [];
        if (Array.isArray(parsed)) dispatch({ type: "hydrate", items: parsed.filter(isValidItem) });
      } catch {
        /* ignorar */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((item: CartItem) => {
    dispatch({ type: "add", item });
    setLastAddedAt(Date.now());
  }, []);
  const setQty = useCallback((key: string, quantity: number) => dispatch({ type: "setQty", key, quantity }), []);
  const remove = useCallback((key: string) => dispatch({ type: "remove", key }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((s, i) => s + i.quantity, 0);
    const total = state.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    return { items: state.items, hydrated: state.hydrated, count, total, isOpen, open, close, add, setQty, remove, clear, lastAddedAt };
  }, [state, isOpen, open, close, add, setQty, remove, clear, lastAddedAt]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
