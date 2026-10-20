import { redirect } from "next/navigation";

// L'ancienne interface caisse fait désormais partie de l'espace staff.
export default function CashierPage() {
  redirect("/staff");
}
