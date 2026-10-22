import type { Metadata } from "next";
import { OrderBoard } from "@/components/staff/order-board";
import { getOrders } from "@/lib/data/orders";
import { getStaffAccess } from "@/lib/data/staff";

export const metadata: Metadata = { title: "Commandes" };

export default async function StaffOrdersPage() {
  const access = await getStaffAccess();
  if (access.status !== "ok") return null; // le layout gère les autres cas

  const orders = access.mode === "live" ? await getOrders("open") : [];
  return <OrderBoard mode={access.mode} initialOrders={orders} />;
}
