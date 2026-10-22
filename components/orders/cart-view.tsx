"use client";

import { CreditCard, Loader2, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cancelMyOrder, placeOrder, startOnlinePayment } from "@/app/actions/orders";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { type CartLine, cartTotal, setQuantity } from "@/lib/cart";
import { useClientCart, writeCart } from "@/lib/client-cart";
import { formatChf, formatXp, xpForAmount } from "@/lib/game";
import type { PaymentMethod, Product } from "@/lib/supabase/database.types";

type Props = {
  products: Product[];
  mode: "demo" | "live";
  signedIn: boolean;
  onlinePayment: boolean;
  /** Commande dont le paiement en ligne vient d'être abandonné (retour de Stripe). */
  cancelledOrderId: string | null;
};

export function CartView({ products, mode, signedIn, onlinePayment, cancelledOrderId }: Props) {
  const router = useRouter();
  const [stored, updateCart] = useClientCart();
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("counter");
  const [pending, setPending] = useState(false);
  // Libère tout de suite le stock réservé (sinon Stripe le fait à l'expiration de la session).
  useEffect(() => {
    if (cancelledOrderId) void cancelMyOrder(cancelledOrderId);
  }, [cancelledOrderId]);

  // Après un paiement en ligne abandonné, Stripe renvoie ici : la commande est libérée à l'expiration.
  const [error, setError] = useState<string | null>(
    cancelledOrderId ? "Paiement annulé : ta commande n'a pas été passée. Ton panier est toujours là." : null,
  );

  // Le panier est confronté au catalogue actuel : prix à jour, articles retirés ou en rupture écartés.
  const cart: CartLine[] = stored.flatMap((l) => {
    const p = products.find((x) => x.id === l.productId);
    if (!p || p.stock === 0) return [];
    return [{ ...l, name: p.name, unitPrice: p.price_chf, quantity: p.stock === null ? l.quantity : Math.min(l.quantity, p.stock) }];
  });
  const removed = stored.length - cart.length;
  const total = cartTotal(cart);


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    setPending(true);
    setError(null);

    if (method === "online") {
      const result = await startOnlinePayment(cart, note);
      if (!result.ok) {
        setPending(false);
        return setError(result.error);
      }
      // Le panier n'est vidé qu'au retour d'un paiement réussi (page Mes commandes).
      window.location.assign(result.data.url);
      return;
    }

    const result = await placeOrder(cart, note, "counter");
    setPending(false);
    if (!result.ok) return setError(result.error);
    writeCart([]);
    router.push(`/commandes?new=${result.data.id}`);
  }

  if (stored.length === 0) {
    return (
      <div className="manga-panel p-6 text-center">
        <p className="font-extrabold text-paper">Ton panier est vide.</p>
        <Link href="/shop" className="pressable mt-4 inline-block border-2 border-black bg-torii px-4 py-2.5 text-sm font-extrabold text-white shadow-panel">
          Voir le shop
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <ul className="divide-y divide-zinc-800 border-[6px] border-black bg-charcoal px-4">
        {cart.map((l) => {
          const stock = products.find((p) => p.id === l.productId)?.stock;
          return (
            <li key={l.key} className="flex items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-paper">{l.name}</span>
                <span className="text-xs tabular-nums text-zinc-400">{formatChf(l.unitPrice)} CHF</span>
              </span>
              <QuantityStepper
                value={l.quantity}
                max={stock ?? undefined}
                label={l.name}
                onChange={(q) => updateCart((c) => setQuantity(c, l.key, q))}
              />
              <span className="w-16 text-right font-extrabold tabular-nums text-paper">{formatChf(l.unitPrice * l.quantity)}</span>
            </li>
          );
        })}
      </ul>
      {removed > 0 && (
        <p className="text-sm text-gold-ink">
          {removed === 1 ? "Un article n'est plus disponible et a été retiré." : `${removed} articles ne sont plus disponibles et ont été retirés.`}
        </p>
      )}

      <div className="flex items-baseline justify-between border-b-2 border-paper pb-3">
        <span className="text-sm font-extrabold uppercase text-zinc-400">Total</span>
        <span className="text-right">
          <span className="block font-display text-3xl tabular-nums text-paper">{formatChf(total)} CHF</span>
          <span className="text-xs font-bold text-gold-ink">+{formatXp(xpForAmount(total))} XP pour ton Pass</span>
        </span>
      </div>

      <div>
        <label htmlFor="order-note" className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">
          Une précision ? (facultatif)
        </label>
        <textarea
          id="order-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          rows={2}
          placeholder="Sans glaçons, table 4…"
          className="w-full border-2 border-zinc-700 bg-ink px-3 py-2.5 text-paper outline-none placeholder:text-zinc-600 focus:border-paper"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Paiement</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <PaymentOption
            checked={method === "counter"}
            onSelect={() => setMethod("counter")}
            icon={<Store className="size-5" />}
            title="Au comptoir"
            detail="Tu paies en récupérant ta commande."
          />
          {onlinePayment && (
            <PaymentOption
              checked={method === "online"}
              onSelect={() => setMethod("online")}
              icon={<CreditCard className="size-5" />}
              title="En ligne"
              detail="TWINT ou carte, maintenant."
            />
          )}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="border-l-4 border-torii bg-torii/10 px-3 py-2 text-sm text-paper">
          {error}
        </p>
      )}

      {mode === "live" && !signedIn ? (
        <Link
          href="/login?next=/shop/panier"
          className="pressable flex w-full items-center justify-center border-2 border-black bg-torii py-4 text-base font-extrabold text-white shadow-panel"
        >
          Se connecter pour commander
        </Link>
      ) : (
        <button
          type="submit"
          disabled={pending || cart.length === 0}
          className="flex w-full items-center justify-center gap-2 border-2 border-black bg-torii py-4 text-base font-extrabold text-white shadow-panel hover:bg-torii-strong disabled:opacity-60"
        >
          {pending && <Loader2 className="size-5 animate-spin" />}
          {method === "online" ? `Payer ${formatChf(total)} CHF` : "Envoyer la commande"}
        </button>
      )}
    </form>
  );
}

function PaymentOption({
  checked,
  onSelect,
  icon,
  title,
  detail,
}: {
  checked: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 border-2 p-3 transition-colors ${
        checked ? "border-paper bg-zinc-900" : "border-zinc-700 hover:border-zinc-500"
      }`}
    >
      <input type="radio" name="payment" checked={checked} onChange={onSelect} className="mt-1 accent-torii" />
      <span className={checked ? "text-paper" : "text-zinc-400"}>{icon}</span>
      <span>
        <span className="block font-extrabold text-paper">{title}</span>
        <span className="text-xs text-zinc-400">{detail}</span>
      </span>
    </label>
  );
}
