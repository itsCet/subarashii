import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { type DashboardData, getDashboardData } from "@/lib/data/dashboard";
import { requireOnboarding } from "@/lib/onboarding";

export const metadata: Metadata = { title: "Pass & Quêtes" };

export default async function PassPage() {
  let data: DashboardData | null;
  try {
    data = await getDashboardData();
  } catch (error) {
    unstable_rethrow(error); // laisse passer les signaux internes de Next (rendu dynamique, redirections)
    // Typiquement : migrations Supabase non appliquées → table ou profil manquant.
    console.error("[pass] chargement impossible :", error);
    return <PassUnavailable />;
  }
  if (!data) redirect("/login?next=/pass");
  requireOnboarding(data.profile, data.mode, "/pass");

  return <DashboardClient initial={data} />;
}

function PassUnavailable() {
  return (
    <section className="mx-auto max-w-md border-2 border-zinc-700 bg-charcoal p-6">
      <h1 className="font-display text-xl text-paper">Ton Pass n&apos;est pas encore prêt</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Tu es bien connecté·e, mais ton profil joueur n&apos;a pas pu être chargé. Réessaie dans un instant ; si ça
        persiste, préviens l&apos;équipe au comptoir.
      </p>
    </section>
  );
}
