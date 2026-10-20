import type { Metadata } from "next";
import { Catalog } from "@/components/shop/catalog";
import { getProducts } from "@/lib/data/products";

export const metadata: Metadata = { title: "Shop", description: "Mangas, cartes TCG et goodies disponibles au Subarashii Manga Café." };

export default async function ShopPage() {
  const products = (await getProducts()).filter((p) => p.is_published);

  return (
    <div>
      <header className="mb-6 border-b-2 border-paper pb-4">
        <h1 className="font-display text-4xl text-paper">Shop</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Mangas, cartes TCG et goodies, à acheter directement au comptoir. Prix en CHF.
        </p>
      </header>
      <Catalog products={products} />
    </div>
  );
}
