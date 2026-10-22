import type { Metadata } from "next";
import { CartView } from "@/components/orders/cart-view";
import { getPlayerSummary } from "@/lib/data/player";
import { getProducts } from "@/lib/data/products";
import { isOnlinePaymentEnabled } from "@/lib/stripe";

export const metadata: Metadata = { title: "Panier" };

export default async function CartPage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const { cancelled } = await searchParams;
  const [products, player] = await Promise.all([getProducts(), getPlayerSummary()]);
  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 border-b-2 border-paper pb-4">
        <h1 className="font-display text-4xl text-paper">Panier</h1>
        <p className="mt-2 text-sm text-zinc-400">On prépare ta commande, tu la récupères au comptoir dès qu&apos;elle est prête.</p>
      </header>
      <CartView
        products={products.filter((p) => p.is_published)}
        mode={player.mode}
        signedIn={player.profile !== null}
        onlinePayment={isOnlinePaymentEnabled}
        cancelledOrderId={cancelled ?? null}
      />
    </div>
  );
}
