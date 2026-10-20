import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/login");

  return <DashboardClient initial={data} />;
}
