const ZURICH = "Europe/Zurich";

/** Secondes restantes avant minuit (heure de Genève) — reset des quêtes quotidiennes. */
export function secondsUntilZurichMidnight(now: number): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZURICH,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return 86_400 - (get("hour") * 3600 + get("minute") * 60 + get("second"));
}

export function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

/** Fin de saison : `end_date` inclus, jusqu'à minuit heure de Genève (approximé en UTC+1). */
export function seasonEndsAt(endDate: string): number {
  return new Date(`${endDate}T23:59:59+01:00`).getTime();
}
