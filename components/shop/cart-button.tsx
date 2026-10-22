"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { cartCount } from "@/lib/cart";
import { useClientCart } from "@/lib/client-cart";

/** Accès au panier, avec le nombre d'articles. */
export function CartButton({ className = "", withLabel = false }: { className?: string; withLabel?: boolean }) {
  const [cart] = useClientCart();
  const count = cartCount(cart);
  return (
    <Link
      href="/shop/panier"
      aria-label={count ? `Panier, ${count} article${count > 1 ? "s" : ""}` : "Panier"}
      className={`pressable relative inline-flex items-center justify-center gap-2 border-2 border-zinc-700 text-paper hover:border-paper ${className}`}
    >
      <ShoppingCart className="size-5" />
      {withLabel && <span className="text-sm font-extrabold">Mon panier</span>}
      {count > 0 && (
        <span className="absolute -top-2 -right-2 grid min-w-5 place-items-center rounded-full border-2 border-black bg-torii px-1 text-[11px] leading-4 font-extrabold text-white tabular-nums">
          {count}
        </span>
      )}
    </Link>
  );
}
