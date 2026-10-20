import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <ComingSoon
      icon={ShoppingBag}
      title="Shop & Catalogue"
      items={["Nouveautés shop", "Cartes TCG", "Recherche dans la bibliothèque manga", "Réservation Click & Collect"]}
    />
  );
}
