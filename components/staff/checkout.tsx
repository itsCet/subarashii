"use client";

import { Check, Crown, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { posCheckout } from "@/app/actions/orders";
import type { MemberSummary, TransactionReceipt } from "@/app/actions/staff";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { SlideToConfirm } from "@/components/ui/slide-to-confirm";
import { TabIndicator } from "@/components/ui/tab-indicator";
import { type CartLine, addToCart, cartCount, cartTotal, setQuantity } from "@/lib/cart";
import { PREMIUM_THRESHOLD_CHF, applyTransaction, formatChf, formatXp } from "@/lib/game";
import { PRODUCT_CATEGORIES } from "@/lib/products-content";
import type { Order, Product, ProductCategory, RecentTransaction } from "@/lib/supabase/database.types";
import { formatDateTimeShort } from "@/lib/time";
import { inputClass, secondaryButton } from "./form";
import { MemberPicker } from "./member-picker";

type Props = {
  mode: "demo" | "live";
  products: Product[];
  initialTransactions: RecentTransaction[];
};

type Sale = { order: Order; receipt: TransactionReceipt | null };

export function Checkout({ mode, products: initialProducts, initialTransactions }: Props) {
  const demo = mode === "demo";
  const [products, setProducts] = useState(initialProducts);
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [history, setHistory] = useState(initialTransactions);
  const onError = useCallback((message: string | null) => setError(message), []);

  const total = cartTotal(cart);
  const preview = member && total > 0 ? applyTransaction(member, total) : null;

  // Le stock affiché tient compte de ce qui est déjà dans le panier.
  const inCart = (id: string) => cart.find((l) => l.key === id)?.quantity ?? 0;
  const available = (p: Product) => (p.stock === null ? Infinity : p.stock - inCart(p.id));

  function addProduct(p: Product) {
    if (available(p) <= 0) return;
    setError(null);
    setCart((c) => addToCart(c, { key: p.id, productId: p.id, name: p.name, unitPrice: p.price_chf }));
  }

  function addCustom(name: string, price: number) {
    setError(null);
    setCart((c) => addToCart(c, { key: `custom-${crypto.randomUUID()}`, productId: null, name, unitPrice: price }));
  }

  function reset() {
    setMember(null);
    setCart([]);
    setSale(null);
    setError(null);
  }

  async function checkout() {
    if (cart.length === 0) return;
    setPending(true);
    setError(null);
    const result = demo ? demoCheckout(member, cart) : await posCheckout(member?.id ?? null, cart);
    setPending(false);
    if (!result.ok) return setError(result.error);

    // Stock local à jour sans recharger la page.
    setProducts((list) =>
      list.map((p) => {
        const sold = inCart(p.id);
        return sold && p.stock !== null ? { ...p, stock: Math.max(p.stock - sold, 0) } : p;
      }),
    );
    setSale(result.data);
    const { receipt } = result.data;
    if (receipt) {
      setHistory((h) =>
        [
          {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            amount_chf: receipt.amount_chf,
            xp_gained: receipt.xp_gained,
            member: receipt.username,
            cashier: "toi",
          },
          ...h,
        ].slice(0, 15),
      );
    }
  }

  if (sale) {
    return (
      <div className="max-w-xl">
        <SaleReceipt sale={sale} onNext={reset} />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-8">
        <MemberPicker demo={demo} member={member} onChange={setMember} onError={onError} />
        <ProductGrid products={products} available={available} onAdd={addProduct} />
        <CustomLine onAdd={addCustom} />
      </div>

      <aside className="space-y-8">
        <section id="cart" aria-labelledby="cart-title" className="scroll-mt-24 border-[6px] border-black bg-charcoal p-4">
          <h2 id="cart-title" className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-zinc-400">
            <ShoppingCart className="size-4" /> Ticket · {cartCount(cart)} article{cartCount(cart) > 1 ? "s" : ""}
          </h2>

          {cart.length === 0 ? (
            <p className="py-6 text-sm text-zinc-400">Touche un article pour l&apos;ajouter au ticket.</p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-800">
              {cart.map((l) => {
                const product = l.productId ? products.find((p) => p.id === l.productId) : undefined;
                const max = product?.stock ?? undefined;
                return (
                  <li key={l.key} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-paper">{l.name}</span>
                      <span className="text-xs tabular-nums text-zinc-400">
                        {formatChf(l.unitPrice)} × {l.quantity} = {formatChf(l.unitPrice * l.quantity)}
                      </span>
                    </span>
                    <QuantityStepper
                      value={l.quantity}
                      max={max}
                      label={l.name}
                      onChange={(q) => setCart((c) => setQuantity(c, l.key, q))}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-3 flex items-baseline justify-between border-t-2 border-paper pt-3">
            <span className="text-sm font-extrabold uppercase text-zinc-400">Total</span>
            <span className="font-display text-3xl tabular-nums text-paper">{formatChf(total)} CHF</span>
          </div>

          {preview && member && (
            <div className="mt-3 border-l-4 border-gold bg-gold/10 px-3 py-2 text-sm text-paper">
              <strong>+{formatXp(preview.xpGained)} XP</strong> pour {member.username}
              {preview.level > preview.levelBefore && <> · passe niveau {preview.level}</>}
              {preview.premiumUnlocked && <p className="mt-1 font-extrabold text-gold-ink">Ce ticket débloque le Pass Premium !</p>}
              {!preview.isPremiumPass && !preview.premiumUnlocked && (
                <p className="mt-1 text-xs text-zinc-400">
                  Cumul saison {formatChf(preview.currentSeasonSpent)} / {formatChf(PREMIUM_THRESHOLD_CHF)} CHF pour le Premium.
                </p>
              )}
            </div>
          )}
          {!member && cart.length > 0 && (
            <p className="mt-3 text-xs text-zinc-400">Sans membre, la vente est enregistrée mais aucune XP n&apos;est créditée.</p>
          )}

          <div className="mt-4">
            <SlideToConfirm
              label={total > 0 ? `Encaisser ${formatChf(total)} CHF` : "Ticket vide"}
              onConfirm={checkout}
              pending={pending}
              disabled={cart.length === 0}
            />
          </div>
          {cart.length > 0 && (
            <button type="button" onClick={() => setCart([])} className="mt-2 flex w-full items-center justify-center gap-1.5 py-2 text-xs font-bold text-zinc-400 hover:text-paper">
              <Trash2 className="size-3.5" /> Vider le ticket
            </button>
          )}

          {error && (
            <p role="alert" className="mt-3 border-l-4 border-torii bg-torii/10 px-3 py-2 text-sm text-paper">
              {error}
            </p>
          )}
        </section>

        <History history={history} />
      </aside>

      {/* Sur téléphone, le ticket est sous la grille : un rappel reste visible en bas. */}
      {cart.length > 0 && (
        <a
          href="#cart"
          className="pressable sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex items-center justify-between border-2 border-black bg-torii px-4 py-3 font-extrabold text-white shadow-panel md:bottom-4 lg:hidden"
        >
          <span>
            {cartCount(cart)} article{cartCount(cart) > 1 ? "s" : ""}
          </span>
          <span className="tabular-nums">Voir le ticket · {formatChf(total)} CHF</span>
        </a>
      )}
    </div>
  );
}

function ProductGrid({
  products,
  available,
  onAdd,
}: {
  products: Product[];
  available: (p: Product) => number;
  onAdd: (p: Product) => void;
}) {
  const [tab, setTab] = useState<ProductCategory>("bar");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = products.filter((p) => (q ? p.name.toLowerCase().includes(q) : p.category === tab));

  return (
    <section aria-labelledby="step-products">
      <h2 id="step-products" className="mb-1 text-sm font-extrabold uppercase tracking-wider text-zinc-400">
        Articles
      </h2>
      <div className="mb-4 flex flex-wrap items-end gap-x-4 border-b border-zinc-800">
        <div role="tablist" aria-label="Rayons" className="scrollbar-none -mb-px flex gap-5 overflow-x-auto">
          {PRODUCT_CATEGORIES.map((c) => {
            const active = !q && tab === c.key;
            return (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(c.key);
                  setQuery("");
                }}
                className={`relative shrink-0 py-3 text-sm font-extrabold ${active ? "text-paper" : "text-zinc-400 hover:text-zinc-300"}`}
              >
                {c.label}
                {active && <TabIndicator layoutId="pos-tab" />}
              </button>
            );
          })}
        </div>
        <div className="relative mb-2 ml-auto w-full sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un article"
            aria-label="Chercher un article"
            className="w-full border-2 border-zinc-700 bg-ink py-2 pr-3 pl-9 text-sm text-paper outline-none placeholder:text-zinc-600 focus:border-paper"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-sm text-zinc-400">
          {q ? "Aucun article ne correspond." : "Aucun article dans ce rayon : ajoute-les dans l'onglet Shop."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-1.5 border-[6px] border-black bg-black sm:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => {
            const left = available(p);
            const soldOut = left <= 0;
            return (
              <li key={p.id} className="flex">
                <button
                  type="button"
                  onClick={() => onAdd(p)}
                  disabled={soldOut}
                  className="flex min-h-24 w-full flex-col bg-charcoal p-3 text-left hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="line-clamp-2 text-sm leading-snug font-extrabold text-paper">{p.name}</span>
                  <span className="mt-auto flex items-baseline justify-between gap-2 pt-2">
                    <span className="font-display text-lg tabular-nums text-paper">{formatChf(p.price_chf)}</span>
                    <span className={`text-[11px] font-bold ${soldOut ? "text-torii-ink" : left <= 3 ? "text-gold-ink" : "text-zinc-400"}`}>
                      {soldOut ? "Rupture" : p.stock === null ? "" : `Stock ${left}`}
                      {!p.is_published && " · masqué"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Ligne libre : article hors catalogue (plat du jour, entrée d'événement…). */
function CustomLine({ onAdd }: { onAdd: (name: string, price: number) => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const value = Number(price.replace(",", "."));
  const valid = Number.isFinite(value) && value > 0 && value <= 10_000;

  return (
    <form
      aria-labelledby="custom-line"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onAdd(name.trim() || "Montant libre", Math.round(value * 100) / 100);
        setName("");
        setPrice("");
      }}
    >
      <h2 id="custom-line" className="mb-3 text-sm font-extrabold uppercase tracking-wider text-zinc-400">
        Montant libre
      </h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Libellé (facultatif)"
          aria-label="Libellé de la ligne"
          className={`${inputClass} sm:flex-1`}
        />
        <div className="flex gap-2">
          <div className="flex flex-1 items-stretch border-2 border-zinc-700 focus-within:border-paper sm:w-36 sm:flex-none">
            <input
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="0.00"
              aria-label="Montant en CHF"
              className="w-full min-w-0 bg-ink px-3 py-2.5 text-paper tabular-nums outline-none placeholder:text-zinc-600"
            />
            <span className="grid place-items-center bg-zinc-800 px-2.5 text-xs font-extrabold text-zinc-300">CHF</span>
          </div>
          <button type="submit" disabled={!valid} className={secondaryButton}>
            <Plus className="size-4" /> Ajouter
          </button>
        </div>
      </div>
    </form>
  );
}

function History({ history }: { history: RecentTransaction[] }) {
  return (
    <section aria-labelledby="history-title">
      <h2 id="history-title" className="mb-3 text-sm font-extrabold uppercase tracking-wider text-zinc-400">
        Derniers tickets membres
      </h2>
      {history.length === 0 ? (
        <p className="text-sm text-zinc-400">Aucun ticket enregistré pour l&apos;instant.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 text-sm">
          {history.map((t) => (
            <li key={t.id} className="flex items-baseline justify-between gap-3 py-2">
              <span className="min-w-0">
                <span className="block truncate font-bold text-paper">{t.member}</span>
                <span className="text-xs text-zinc-400">
                  {formatDateTimeShort(t.created_at)} · {t.cashier}
                </span>
              </span>
              <span className="shrink-0 text-right tabular-nums">
                <span className="block text-paper">{formatChf(t.amount_chf)}</span>
                <span className="text-xs text-gold-ink">+{t.xp_gained} XP</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SaleReceipt({ sale, onNext, nextLabel = "Vente suivante" }: { sale: Sale; onNext: () => void; nextLabel?: string }) {
  const { order, receipt } = sale;
  return (
    <section
      aria-live="polite"
      className="border-[6px] border-black bg-paper p-6 text-ink transition duration-200 ease-snappy starting:scale-[0.97] starting:opacity-0 motion-reduce:starting:scale-100"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center bg-emerald-500 text-white">
          <Check className="size-7" strokeWidth={3} />
        </span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Encaissé · n° {order.number}</p>
          <p className="font-display text-2xl leading-tight">{receipt?.username ?? order.username ?? "Client de passage"}</p>
        </div>
      </div>

      <ul className="mt-5 divide-y divide-zinc-800 border-y-2 border-black text-sm">
        {order.items.map((i, n) => (
          <li key={n} className="flex justify-between gap-3 py-1.5">
            <span>
              {i.quantity} × {i.name}
            </span>
            <span className="tabular-nums">{formatChf(i.unit_price_chf * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex items-baseline justify-between font-extrabold">
        <span>Total</span>
        <span className="font-display text-2xl tabular-nums">{formatChf(order.total_chf)} CHF</span>
      </p>

      {receipt && (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-center">
            <div className="border-2 border-black p-3">
              <dt className="text-xs font-bold uppercase text-zinc-400">XP</dt>
              <dd className="font-display text-xl">+{formatXp(receipt.xp_gained)}</dd>
            </div>
            <div className="border-2 border-black p-3">
              <dt className="text-xs font-bold uppercase text-zinc-400">Niveau</dt>
              <dd className="font-display text-xl">
                {receipt.level}
                {receipt.level > receipt.level_before && <span className="text-sm text-torii-ink-inv"> ↑</span>}
              </dd>
            </div>
          </dl>
          {receipt.premium_unlocked && (
            <p className="mt-4 flex items-center gap-2 border-2 border-black bg-gold px-4 py-3 font-extrabold text-black">
              <Crown className="size-5" /> Pass Premium débloqué ! Préviens le client.
            </p>
          )}
          <p className="mt-4 text-sm text-zinc-700">
            Cumul saison : {formatChf(receipt.current_season_spent)} CHF · {formatXp(receipt.xp)} XP au total.
          </p>
        </>
      )}

      <button
        type="button"
        onClick={onNext}
        autoFocus
        className="mt-6 w-full border-2 border-black bg-ink py-4 text-base font-extrabold text-paper hover:bg-black"
      >
        {nextLabel}
      </button>
    </section>
  );
}

let demoNumber = 41;

/** Mode démo : même résultat que la base, calculé localement. */
function demoCheckout(member: MemberSummary | null, cart: CartLine[]): { ok: true; data: Sale } {
  const total = cartTotal(cart);
  const now = new Date().toISOString();
  const o = member ? applyTransaction(member, total) : null;
  return {
    ok: true,
    data: {
      order: {
        id: crypto.randomUUID(),
        number: ++demoNumber,
        user_id: member?.id ?? null,
        username: member?.username ?? null,
        source: "pos",
        status: "completed",
        payment_method: "counter",
        payment_status: "paid",
        total_chf: total,
        note: null,
        created_at: now,
        paid_at: now,
        completed_at: now,
        items: cart.map((l) => ({ name: l.name, unit_price_chf: l.unitPrice, quantity: l.quantity, product_id: l.productId })),
      },
      receipt:
        member && o
          ? {
              username: member.username,
              amount_chf: total,
              xp_gained: o.xpGained,
              xp: o.xp,
              level_before: o.levelBefore,
              level: o.level,
              current_season_spent: o.currentSeasonSpent,
              is_premium_pass: o.isPremiumPass,
              premium_unlocked: o.premiumUnlocked,
            }
          : null,
    },
  };
}
