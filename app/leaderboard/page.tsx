import { Trophy } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Classement" };

export default function LeaderboardPage() {
  return (
    <ComingSoon
      icon={Trophy}
      title="TOP 10 de la saison"
      items={["Podium des 3 meilleurs joueurs", "Rangs 4 à 10", "Récompenses de fin de saison", "Compte à rebours"]}
    />
  );
}
