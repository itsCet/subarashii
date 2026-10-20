"use client";

import { QRCodeSVG } from "qrcode.react";
import { formatXp, levelForXp } from "@/lib/game";
import type { Profile } from "@/lib/supabase/database.types";

/** Contenu du QR code lu par la caisse (l'identifiant y est extrait par motif UUID). */
export const memberQrValue = (id: string) => `SUBARASHII:${id}`;

export function MemberCard({ profile }: { profile: Profile }) {
  return (
    <section aria-label="Carte membre" className="mx-auto max-w-sm border-[6px] border-black bg-paper text-ink">
      <div className="flex items-baseline justify-between border-b-[6px] border-black bg-torii px-4 py-2 text-white">
        <span className="font-display text-sm">SUBARASHII</span>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Carte membre</span>
      </div>
      <div className="tone flex flex-col items-center px-6 py-6">
        <div className="border-[6px] border-black bg-white p-3">
          <QRCodeSVG value={memberQrValue(profile.id)} size={208} level="M" marginSize={0} />
        </div>
        <p className="mt-4 font-display text-2xl leading-none">{profile.username ?? "Otaku"}</p>
        <p className="mt-1 text-sm text-zinc-700">
          Niveau {levelForXp(profile.xp)} · {formatXp(profile.xp)} XP{profile.is_premium_pass && " · Premium"}
        </p>
      </div>
      <p className="border-t-2 border-black px-4 py-2 text-center text-xs font-bold">
        Présente ce QR code en caisse à chaque achat
      </p>
    </section>
  );
}
