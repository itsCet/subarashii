import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { CartButton } from "@/components/shop/cart-button";
import { Catalog } from "@/components/shop/catalog";
import { getProducts } from "@/lib/data/products";

export const metadata: Metadata = { title: "Shop", description: "Boissons, snacks, mangas, cartes TCG et goodies du Subarashii Manga Café." };

export default async function ShopPage() {
  const products = (await getProducts()).filter((p) => p.is_published);

  return (
    <div>
      <header className="mb-6 border-b-2 border-paper pb-4">
        <h1 className="font-display text-4xl text-paper">Shop</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Boissons, snacks, mangas, cartes TCG et goodies. Commande depuis ton téléphone et récupère au comptoir :
          chaque franc dépensé te rapporte 10 XP. Prix en CHF.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CartButton withLabel className="px-4 py-2.5" />
          <Link
            href="/commandes"
            className="pressable inline-flex items-center gap-2 border-2 border-zinc-700 px-4 py-2.5 text-sm font-extrabold text-paper hover:border-paper"
          >
            <ClipboardList className="size-5" /> Mes commandes
          </Link>
        </div>
      </header>
      <Catalog products={products} />
    </div>
  );
}
