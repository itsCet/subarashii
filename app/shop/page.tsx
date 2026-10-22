import type { Metadata } from "next";
import Link from "next/link";
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
        <Link href="/commandes" className="mt-3 inline-block text-sm font-bold text-torii-ink underline underline-offset-4">
          Mes commandes
        </Link>
      </header>
      <Catalog products={products} />
    </div>
  );
}
