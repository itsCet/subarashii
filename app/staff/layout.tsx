import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StaffTabs } from "@/components/staff/staff-tabs";
import { getStaffAccess } from "@/lib/data/staff";

export const metadata: Metadata = { title: { default: "Espace staff", template: "%s · Staff Subarashii" } };

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const access = await getStaffAccess();
  if (access.status === "anonymous") redirect("/login?next=/staff");

  // Un compte client ne doit même pas savoir que cette page existe.
  if (access.status === "forbidden") notFound();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-x-4 gap-y-1 border-b-2 border-paper pb-3">
        <h1 className="font-display text-3xl leading-none text-paper">Espace staff</h1>
        <p className="text-sm text-zinc-400">
          {access.profile.username} · {access.profile.role === "admin" ? "admin" : "caisse"}
        </p>
        {access.mode === "demo" && (
          <p className="w-full text-xs text-gold-ink">Mode démo : rien n&apos;est enregistré tant que Supabase n&apos;est pas branché.</p>
        )}
      </div>
      <StaffTabs />
      {children}
    </div>
  );
}
