import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MyOrders } from "@/components/orders/my-orders";
import { getOrders } from "@/lib/data/orders";
import { getPlayerSummary } from "@/lib/data/player";

export const metadata: Metadata = { title: "Mes commandes" };

export default async function OrdersPage() {
  const player = await getPlayerSummary();
  if (player.mode === "live" && !player.profile) redirect("/login?next=/commandes");
  const orders = player.mode === "live" ? await getOrders("mine") : [];

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-end justify-between gap-4 border-b-2 border-paper pb-4">
        <h1 className="font-display text-4xl text-paper">Mes commandes</h1>
        <Link href="/shop" className="text-sm font-bold text-torii-ink underline underline-offset-4">
          Retour au shop
        </Link>
      </header>
      <MyOrders mode={player.mode} userId={player.profile?.id ?? null} initialOrders={orders} />
    </div>
  );
}
