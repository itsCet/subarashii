import type { Metadata } from "next";
import { ProductManager } from "@/components/staff/product-manager";
import { getProducts } from "@/lib/data/products";
import { getStaffAccess } from "@/lib/data/staff";

export const metadata: Metadata = { title: "Shop" };

export default async function StaffShopPage() {
  const access = await getStaffAccess();
  if (access.status !== "ok") return null;

  // Le staff voit aussi les articles masqués (RLS).
  const products = await getProducts();
  return <ProductManager mode={access.mode} initialProducts={products} />;
}
