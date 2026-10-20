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

/** Instant correspondant à « aujourd'hui + n jours, à HH:MM » heure de Genève. */
export function zurichDateTime(dayOffset: number, hhmm: string, now = Date.now()): Date {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: ZURICH }).format(now); // AAAA-MM-JJ
  const [y, m, d] = today.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  const asUtc = Date.UTC(y, m - 1, d + dayOffset, h, min);
  // Décalage de Genève à cet instant (UTC+1 ou UTC+2 selon l'heure d'été).
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: ZURICH, timeZoneName: "longOffset" })
    .formatToParts(asUtc)
    .find((p) => p.type === "timeZoneName")?.value;
  const match = offset?.match(/GMT([+-])(\d{2}):(\d{2})/);
  const offsetMin = match ? (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 60;
  return new Date(asUtc - offsetMin * 60_000);
}

export function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat("fr-CH", {
    timeZone: ZURICH,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

export function formatEventTime(iso: string) {
  return new Intl.DateTimeFormat("fr-CH", { timeZone: ZURICH, hour: "2-digit", minute: "2-digit" })
    .format(new Date(iso))
    .replace(":", "h");
}

export function eventDayParts(iso: string) {
  const date = new Date(iso);
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fr-CH", { timeZone: ZURICH, ...opts }).format(date);
  return { day: fmt({ day: "2-digit" }), month: fmt({ month: "short" }).replace(".", ""), weekday: fmt({ weekday: "short" }).replace(".", "") };
}
