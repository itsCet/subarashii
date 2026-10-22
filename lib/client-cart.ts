"use client";

// Panier du client, gardé dans le navigateur (localStorage) entre les pages.
import { useSyncExternalStore } from "react";
import type { CartLine } from "./cart";

const KEY = "subarashii:cart";
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; cart: CartLine[] } = { raw: null, cart: EMPTY };

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cache.cart;
  }
  if (raw === cache.raw) return cache.cart;
  let cart = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) cart = parsed.filter((l) => l && typeof l.key === "string" && l.productId);
  } catch {
    // panier illisible : on repart de zéro
  }
  cache = { raw, cart };
  return cart;
}

export function writeCart(cart: CartLine[]) {
  const raw = JSON.stringify(cart);
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    // stockage indisponible (navigation privée) : le panier vit en mémoire
  }
  cache = { raw, cart };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useClientCart() {
  const cart = useSyncExternalStore(subscribe, read, () => EMPTY);
  return [cart, (update: (cart: CartLine[]) => CartLine[]) => writeCart(update(read()))] as const;
}
