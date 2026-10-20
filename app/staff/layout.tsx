import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffTabs } from "@/components/staff/staff-tabs";
import { getStaffAccess } from "@/lib/data/staff";

export const metadata: Metadata = { title: { default: "Espace staff", template: "%s · Staff Subarashii" } };

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const access = await getStaffAccess();
  if (access.status === "anonymous") redirect("/login?next=/staff");

  if (access.status === "forbidden") {
    return (
      <section className="mx-auto max-w-md border-2 border-zinc-700 bg-charcoal p-6">
        <h1 className="font-display text-xl text-paper">Accès réservé au personnel</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Ton compte n&apos;a pas le rôle caisse ou admin. Demande à un admin du café de te l&apos;attribuer.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-bold text-paper underline decoration-torii underline-offset-4">
          Retour à l&apos;accueil
        </Link>
      </section>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-x-4 gap-y-1 border-b-2 border-paper pb-3">
        <h1 className="font-display text-3xl leading-none text-paper">Espace staff</h1>
        <p className="text-sm text-zinc-400">
          {access.profile.username} · {access.profile.role === "admin" ? "admin" : "caisse"}
        </p>
        {access.mode === "demo" && (
          <p className="w-full text-xs text-gold">Mode démo : rien n&apos;est enregistré tant que Supabase n&apos;est pas branché.</p>
        )}
      </div>
      <StaffTabs />
      {children}
    </div>
  );
}
