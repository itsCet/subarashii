import { QrCode } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Ma carte" };

export default function ProfilePage() {
  return (
    <ComingSoon
      icon={QrCode}
      title="Carte de membre"
      items={["QR Code personnel à présenter en caisse", "Historique des transactions", "Récompenses débloquées"]}
    />
  );
}
