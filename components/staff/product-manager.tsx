"use client";

import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { type ProductInput, deleteProduct, saveProduct } from "@/app/actions/staff";
import { Toaster, useToasts } from "@/components/ui/toaster";
import { formatChf } from "@/lib/game";
import { PRODUCT_CATEGORIES, productCategoryLabel } from "@/lib/products-content";
import type { Product } from "@/lib/supabase/database.types";
import { Field, Toggle, inputClass, primaryButton, secondaryButton } from "./form";
import { ImageField } from "./image-field";

type Props = { mode: "demo" | "live"; initialProducts: Product[] };

const EMPTY: ProductInput = {
  name: "",
  category: "manga",
  description: "",
  priceChf: 0,
  stock: null,
  imageUrl: null,
  isNew: true,
  isPublished: true,
};

const toInput = (p: Product): ProductInput => ({
  id: p.id,
  name: p.name,
  category: p.category,
  description: p.description,
  priceChf: p.price_chf,
  stock: p.stock,
  imageUrl: p.image_url,
  isNew: p.is_new,
  isPublished: p.is_published,
});

export function ProductManager({ mode, initialProducts }: Props) {
  const demo = mode === "demo";
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<ProductInput | null>(null);
  const [filter, setFilter] = useState("");
  const { toasts, push } = useToasts();

  const visible = filter
    ? products.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
    : products;

  async function onSubmit(input: ProductInput) {
    let product: Product;
    if (demo) {
      product = {
        id: input.id ?? crypto.randomUUID(),
        name: input.name,
        category: input.category,
        description: input.description,
        price_chf: input.priceChf,
        stock: input.stock,
        image_url: input.imageUrl,
        is_new: input.isNew,
        is_published: input.isPublished,
        created_at: products.find((p) => p.id === input.id)?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      const result = await saveProduct(input);
      if (!result.ok) return result.error;
      product = result.data;
    }
    setProducts((list) => (list.some((p) => p.id === product.id) ? list.map((p) => (p.id === product.id ? product : p)) : [product, ...list]));
    setEditing(null);
    push(`« ${product.name} » enregistré`, "info");
  }

  async function remove(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product || !window.confirm(`Supprimer « ${product.name} » ?`)) return;
    if (!demo) {
      const result = await deleteProduct(id);
      if (!result.ok) return push(result.error, "error");
    }
    setProducts((list) => list.filter((p) => p.id !== id));
    setEditing(null);
    push("Article supprimé", "info");
  }

  return (
    <div>
      <Toaster toasts={toasts} />

      {editing ? (
        <ProductForm
          initial={editing}
          demo={demo}
          onSubmit={onSubmit}
          onCancel={() => setEditing(null)}
          onDelete={editing.id ? () => remove(editing.id!) : undefined}
        />
      ) : (
        <div className="mb-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => setEditing(EMPTY)} className={primaryButton}>
            <Plus className="size-4" /> Nouvel article
          </button>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer les articles"
            aria-label="Filtrer les articles"
            className={`${inputClass} max-w-xs`}
          />
        </div>
      )}

      <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-zinc-400">Articles · {products.length}</h2>
      {visible.length === 0 ? (
        <p className="text-sm text-zinc-400">Aucun article.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 border-y border-zinc-800">
          {visible.map((p) => (
            <li key={p.id} className="flex items-center gap-4 py-3">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- image distante (Supabase Storage)
                <img src={p.image_url} alt="" className="size-14 shrink-0 border-2 border-zinc-700 object-cover" />
              ) : (
                <div className="grid size-14 shrink-0 place-items-center border-2 border-zinc-800 text-[11px] text-zinc-400">photo</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-paper">
                  {p.name}
                  {p.is_new && <span className="ml-2 text-xs font-bold text-torii-ink">nouveau</span>}
                  {!p.is_published && <span className="ml-2 text-xs font-bold text-gold-ink">masqué</span>}
                </p>
                <p className="text-xs text-zinc-400">
                  {productCategoryLabel(p.category)} · {formatChf(p.price_chf)} CHF
                  {p.stock !== null && (
                    <span className={p.stock === 0 ? "text-torii-ink" : ""}> · {p.stock === 0 ? "rupture" : `${p.stock} en stock`}</span>
                  )}
                </p>
              </div>
              <button type="button" onClick={() => setEditing(toInput(p))} className={secondaryButton}>
                Modifier
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductForm({
  initial,
  demo,
  onSubmit,
  onCancel,
  onDelete,
}: {
  initial: ProductInput;
  demo: boolean;
  onSubmit: (input: ProductInput) => Promise<string | void>;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [trackStock, setTrackStock] = useState(initial.stock !== null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const message = await onSubmit({ ...form, stock: trackStock ? (form.stock ?? 0) : null });
    setPending(false);
    if (message) setError(message);
  }

  return (
    <form onSubmit={submit} className="mb-8 border-[6px] border-black bg-charcoal p-5 transition duration-200 ease-snappy starting:-translate-y-1.5 starting:opacity-0 motion-reduce:starting:translate-y-0">
      <h2 className="mb-5 font-display text-xl text-paper">{form.id ? "Modifier l'article" : "Nouvel article"}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" htmlFor="pr-name" className="sm:col-span-2">
          <input id="pr-name" required maxLength={120} value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="One Piece — tome 108" />
        </Field>
        <Field label="Catégorie" htmlFor="pr-category">
          <select id="pr-category" value={form.category} onChange={(e) => set("category", e.target.value as ProductInput["category"])} className={inputClass}>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Prix (CHF)" htmlFor="pr-price">
          <input id="pr-price" type="number" min={0} step={0.05} required value={form.priceChf} onChange={(e) => set("priceChf", Number(e.target.value))} className={inputClass} />
        </Field>
        <Field label="Stock" htmlFor="pr-stock">
          <input id="pr-stock" type="number" min={0} disabled={!trackStock} value={form.stock ?? ""} onChange={(e) => set("stock", Number(e.target.value))} className={`${inputClass} disabled:opacity-40`} />
          <div className="mt-2">
            <Toggle id="pr-track" label="Suivre le stock" checked={trackStock} onChange={setTrackStock} />
          </div>
        </Field>
        <Field label="Photo" htmlFor="pr-image">
          <ImageField id="pr-image" value={form.imageUrl} onChange={(url) => set("imageUrl", url)} folder="products" demo={demo} />
        </Field>
        <Field label="Description" htmlFor="pr-description" className="sm:col-span-2">
          <textarea id="pr-description" rows={3} maxLength={1000} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
        </Field>
        <div className="flex flex-wrap gap-6 sm:col-span-2">
          <Toggle id="pr-new" label="Nouveauté" checked={form.isNew} onChange={(v) => set("isNew", v)} />
          <Toggle id="pr-published" label="Visible dans le shop" checked={form.isPublished} onChange={(v) => set("isPublished", v)} />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-torii-ink">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Enregistrer
        </button>
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Annuler
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="ml-auto text-sm font-bold text-torii-ink hover:underline">
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
}
