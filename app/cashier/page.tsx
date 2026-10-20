import { ScanLine } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Caisse" };

export default function CashierPage() {
  return (
    <ComingSoon
      icon={ScanLine}
      title="Interface caisse"
      items={["Scan du QR Code membre", "Saisie du montant du ticket", "Crédit XP et déblocage du Pass Premium"]}
    />
  );
}
