// Catégories du shop et articles d'exemple pour le mode démo.
import type { Product, ProductCategory } from "./supabase/database.types";

export const PRODUCT_CATEGORIES: { key: ProductCategory; label: string }[] = [
  { key: "bar", label: "Bar & snacks" },
  { key: "manga", label: "Mangas" },
  { key: "tcg", label: "Cartes TCG" },
  { key: "goodies", label: "Goodies" },
];

export const productCategoryLabel = (c: ProductCategory) => PRODUCT_CATEGORIES.find((x) => x.key === c)?.label ?? c;

const demo = (p: Partial<Product> & Pick<Product, "name" | "category" | "price_chf">, i: number): Product => ({
  id: `demo-product-${i}`,
  description: "",
  stock: null,
  image_url: null,
  is_new: false,
  is_published: true,
  created_at: new Date(Date.now() - i * 86_400_000).toISOString(),
  updated_at: new Date().toISOString(),
  ...p,
});

export const DEMO_PRODUCTS: Product[] = [
  { name: "Thé glacé maison", category: "bar", price_chf: 4.5, stock: null, description: "Pêche ou citron." },
  { name: "Bubble tea", category: "bar", price_chf: 6.5, stock: null, description: "Lait, taro ou matcha." },
  { name: "Mochi glacé", category: "bar", price_chf: 3.5, stock: 20, description: "À l'unité." },
  { name: "Ramune", category: "bar", price_chf: 4, stock: 24, description: "Limonade japonaise." },
  { name: "One Piece — tome 108", category: "manga", price_chf: 9.9, stock: 12, is_new: true, description: "Édition française." },
  { name: "Display One Piece Card Game OP-10", category: "tcg", price_chf: 129, stock: 3, is_new: true, description: "24 boosters." },
  { name: "Booster Pokémon Écarlate & Violet", category: "tcg", price_chf: 6.5, stock: 40, description: "À l'unité." },
  { name: "Chainsaw Man — tome 18", category: "manga", price_chf: 9.9, stock: 6, description: "" },
  { name: "Sleeves Dragon Shield (x100)", category: "tcg", price_chf: 14.9, stock: 15, description: "Plusieurs couleurs." },
  { name: "Tote bag Subarashii", category: "goodies", price_chf: 18, stock: null, description: "Le sac du café." },
].map((p, i) => demo(p as Partial<Product> & Pick<Product, "name" | "category" | "price_chf">, i));
