import type { Metadata } from "next";
import { Checkout } from "@/components/staff/checkout";
import { getRecentTransactions, getStaffAccess } from "@/lib/data/staff";

export const metadata: Metadata = { title: "Caisse" };

export default async function StaffCheckoutPage() {
  const access = await getStaffAccess();
  if (access.status !== "ok") return null; // le layout gère les autres cas

  const transactions = await getRecentTransactions(access.mode).catch(() => []);
  return <Checkout mode={access.mode} initialTransactions={transactions} />;
}
