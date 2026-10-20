import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { MemberCard } from "@/components/member-card";
import { MyRewards } from "@/components/my-rewards";
import { SectionTitle } from "@/components/ui/section-title";
import { getPlayerSummary } from "@/lib/data/player";
import { getMyRewards } from "@/lib/data/rewards";
import { formatChf } from "@/lib/game";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Transaction } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeShort } from "@/lib/time";

export const metadata: Metadata = { title: "Mon profil" };

async function getMyTransactions(): Promise<Transaction[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(10);
  return (data ?? []).map((t) => ({ ...t, amount_chf: Number(t.amount_chf) }));
}

export default async function ProfilePage() {
  const { mode, profile } = await getPlayerSummary();
  if (!profile) redirect("/login?next=/profile");

  const [transactions, rewards] = await Promise.all([getMyTransactions(), getMyRewards()]);
  const isStaff = profile.role === "cashier" || profile.role === "admin";

  return (
    <div className="space-y-12">
      <MemberCard profile={profile} />

      {(isStaff || mode === "demo") && (
        <Link
          href="/staff"
          className="mx-auto block max-w-sm border-2 border-black bg-gold px-4 py-3 text-center text-sm font-extrabold text-black shadow-panel"
        >
          Espace staff : caisse, agenda, shop
        </Link>
      )}

      <MyRewards rewards={rewards} index="01" />

      <section aria-labelledby="history-title">
        <SectionTitle index="02" title="Mes passages en caisse" id="history-title" />
        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {mode === "demo" ? "Historique disponible une fois Supabase branché." : "Aucun achat enregistré pour l'instant."}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-baseline justify-between py-3 text-sm">
                <span className="text-zinc-400">{formatDateTimeShort(t.created_at)}</span>
                <span className="tabular-nums text-paper">
                  {formatChf(t.amount_chf)} CHF <span className="ml-2 text-gold">+{t.xp_gained} XP</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {mode === "live" && (
        <form action={signOut}>
          <button type="submit" className="text-sm font-bold text-zinc-400 underline underline-offset-4 hover:text-paper">
            Se déconnecter
          </button>
        </form>
      )}
    </div>
  );
}
