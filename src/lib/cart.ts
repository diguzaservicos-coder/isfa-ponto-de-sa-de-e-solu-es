import { useEffect, useState } from "react";

// Carrinho do visitante. Guarda só o id do produto e a quantidade; nomes e preços vêm sempre do catálogo.
export type CartLine = { id: string; qty: number };
const KEY = "isfa-cart-v1";
const MAX_QTY = 999;

let lines: CartLine[] = (() => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v)
      ? v.filter((l) => l && typeof l.id === "string" && Number.isInteger(l.qty) && l.qty > 0).map((l) => ({ id: l.id, qty: Math.min(l.qty, MAX_QTY) }))
      : [];
  } catch {
    return [];
  }
})();
const subs = new Set<() => void>();
const commit = (next: CartLine[]) => {
  lines = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* sem armazenamento: o carrinho vive só nesta página */
  }
  subs.forEach((f) => f());
};

export const cart = {
  add: (id: string, qty = 1) => {
    const cur = lines.find((l) => l.id === id);
    commit(cur ? lines.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY) } : l)) : [...lines, { id, qty }]);
  },
  set: (id: string, qty: number) => {
    if (!Number.isFinite(qty) || qty < 1) return commit(lines.filter((l) => l.id !== id));
    commit(lines.map((l) => (l.id === id ? { ...l, qty: Math.min(Math.floor(qty), MAX_QTY) } : l)));
  },
  remove: (id: string) => commit(lines.filter((l) => l.id !== id)),
  clear: () => commit([]),
};

export function useCart(): CartLine[] {
  const [, setN] = useState(0);
  useEffect(() => {
    const f = () => setN((n) => n + 1);
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);
  return lines;
}
