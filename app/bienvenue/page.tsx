import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getPlayerSummary } from "@/lib/data/player";

export const metadata: Metadata = { title: "Bienvenue" };

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams;
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/pass";

  const { mode, profile } = await getPlayerSummary();
  if (!profile) redirect(`/login?next=${encodeURIComponent("/bienvenue")}`);
  if (mode === "live" && profile.onboarded_at) redirect(next);

  return (
    <OnboardingFlow
      next={next}
      initialUsername={profile.username ?? ""}
      initialUniverses={profile.favorite_universes ?? []}
    />
  );
}
