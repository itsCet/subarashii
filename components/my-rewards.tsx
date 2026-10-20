import { Check, Gift } from "lucide-react";
import Link from "next/link";
import { RewardIcon } from "@/components/ui/reward-icon";
import { SectionTitle } from "@/components/ui/section-title";
import type { MyReward } from "@/lib/supabase/database.types";
import { formatDateTimeShort } from "@/lib/time";

export function MyRewards({ rewards, index }: { rewards: MyReward[]; index: string }) {
  const toCollect = rewards.filter((r) => r.redeemable && !r.redeemed_at);
  const collected = rewards.filter((r) => r.redeemable && r.redeemed_at);
  const digital = rewards.filter((r) => !r.redeemable);

  return (
    <section id="recompenses" aria-labelledby="rewards-title" className="scroll-mt-24">
      <SectionTitle index={index} title="Mes récompenses" id="rewards-title" action={{ href: "/pass", label: "Voir le Pass" }} />

      {rewards.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Aucune récompense pour l&apos;instant. Réclame-les dans le{" "}
          <Link href="/pass" className="font-bold text-paper underline decoration-torii underline-offset-4">
            Pass de Combat
          </Link>{" "}
          au fil de tes niveaux.
        </p>
      ) : (
        <div className="space-y-8">
          {toCollect.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 font-extrabold text-paper">
                <Gift className="size-4 text-torii" /> À retirer au comptoir · {toCollect.length}
              </h3>
              <p className="mt-1 text-sm text-zinc-400">Montre ta carte membre en caisse : l&apos;équipe te remet la récompense.</p>
              <ul className="mt-3 grid gap-1.5 border-[6px] border-black bg-black sm:grid-cols-2">
                {toCollect.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 bg-charcoal p-3">
                    <span className={`grid size-10 shrink-0 place-items-center ${r.track === "premium" ? "bg-gold text-black" : "bg-torii text-white"}`}>
                      <RewardIcon icon={r.icon_name} className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-extrabold text-paper">{r.reward}</span>
                      <span className="text-xs text-zinc-400">
                        Palier {r.tier_level} · {r.track === "premium" ? "Premium" : "Gratuit"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {digital.length > 0 && (
            <div>
              <h3 className="font-extrabold text-paper">Badges, titres & cadres</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {digital.map((r) => (
                  <li key={r.id} className="inline-flex items-center gap-1.5 border-2 border-zinc-700 px-3 py-1.5 text-sm font-bold text-paper">
                    <RewardIcon icon={r.icon_name} className="size-4 text-gold" /> {r.reward}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {collected.length > 0 && (
            <div>
              <h3 className="font-extrabold text-paper">Déjà retirées</h3>
              <ul className="mt-2 divide-y divide-zinc-800">
                {collected.map((r) => (
                  <li key={r.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                    <span className="inline-flex items-center gap-2 text-zinc-400">
                      <Check className="size-4 text-ok" /> {r.reward}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">{formatDateTimeShort(r.redeemed_at!)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
