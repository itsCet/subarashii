import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getDashboardData } from "@/lib/data/dashboard";

export const metadata: Metadata = { title: "Pass & Quêtes" };

export default async function PassPage() {
  const data = await getDashboardData();
  if (!data) redirect("/login?next=/pass");

  return <DashboardClient initial={data} />;
}
