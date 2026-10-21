"use client";

import { useState } from "react";
import { formatChf } from "@/lib/game";
import { PRODUCT_CATEGORIES, productCategoryLabel } from "@/lib/products-content";
import type { Product, ProductCategory } from "@/lib/supabase/database.types";

type Tab = "new" | ProductCategory;

export function Catalog({ products }: { products: Product[] }) {
  const hasNew = products.some((p) => p.is_new);
  const [tab, setTab] = useState<Tab>(hasNew ? "new" : "manga");
  const [query, setQuery] = useState("");

  const tabs: { key: Tab; label: string }[] = [...(hasNew ? [{ key: "new" as const, label: "Nouveautés" }] : []), ...PRODUCT_CATEGORIES];
  const q = query.trim().toLowerCase();
  const visible = products.filter((p) => (q ? p.name.toLowerCase().includes(q) : tab === "new" ? p.is_new : p.category === tab));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-4 border-b border-zinc-800">
        <div role="tablist" aria-label="Rayons" className="scrollbar-none -mb-px flex gap-6 overflow-x-auto">
          {tabs.map((t) => {
            const active = !q && tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(t.key);
                  setQuery("");
                }}
                className={`shrink-0 border-b-2 py-3 text-sm font-extrabold ${
                  active ? "border-torii text-paper" : "border-transparent text-zinc-400 hover:text-zinc-300"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un titre…"
          aria-label="Chercher dans le shop"
          className="mb-2 ml-auto w-full border-2 border-zinc-700 bg-ink px-3 py-2 text-sm text-paper outline-none placeholder:text-zinc-600 focus:border-paper sm:w-64"
        />
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-sm text-zinc-400">{q ? "Aucun article ne correspond." : "Rien dans ce rayon pour le moment."}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-1.5 border-[6px] border-black bg-black sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <li key={p.id} className="flex flex-col bg-charcoal">
              <div className="relative aspect-[3/4] bg-paper">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- image distante (Supabase Storage)
                  <img src={p.image_url} alt="" className="size-full object-cover" />
                ) : (
                  <div className="tone grid size-full place-items-center p-4 text-center font-display text-lg leading-tight text-ink">
                    {p.name}
                  </div>
                )}
                {p.is_new && <span className="absolute top-2 left-2 bg-torii px-2 py-0.5 text-[11px] font-extrabold uppercase text-white">Nouveau</span>}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <span className="text-[11px] font-bold uppercase text-zinc-400">{productCategoryLabel(p.category)}</span>
                <h2 className="mt-0.5 text-sm leading-snug font-extrabold text-paper">{p.name}</h2>
                {p.description && <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{p.description}</p>}
                <div className="mt-auto flex items-baseline justify-between pt-3">
                  <span className="font-display text-lg text-paper">{formatChf(p.price_chf)}</span>
                  {p.stock !== null && (
                    <span className={`text-xs font-bold ${p.stock === 0 ? "text-torii-ink" : p.stock <= 3 ? "text-gold-ink" : "text-zinc-400"}`}>
                      {p.stock === 0 ? "Rupture" : p.stock <= 3 ? `Plus que ${p.stock}` : "En stock"}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
