import { OPENING_HOURS, WEEKDAYS } from "./cafe";

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Jour (0 = dimanche) et minute courante à Genève. */
export function zurichClock(now: number) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zurich",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export type OpenStatus =
  | { open: true; closesAt: string }
  | { open: false; opensAt: string | null; opensDay: string | null };

export function openStatus(now: number, hours = OPENING_HOURS): OpenStatus {
  const { day, minutes } = zurichClock(now);

  // Créneau de la veille qui déborde après minuit.
  const yesterday = hours[(day + 6) % 7];
  if (yesterday && toMinutes(yesterday.close) <= toMinutes(yesterday.open) && minutes < toMinutes(yesterday.close)) {
    return { open: true, closesAt: yesterday.close };
  }

  const today = hours[day];
  if (today) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    const overnight = close <= open;
    if (minutes >= open && (overnight || minutes < close)) return { open: true, closesAt: today.close };
    if (minutes < open) return { open: false, opensAt: today.open, opensDay: null };
  }

  for (let i = 1; i <= 7; i++) {
    const next = hours[(day + i) % 7];
    if (next) return { open: false, opensAt: next.open, opensDay: i === 1 ? "demain" : WEEKDAYS[(day + i) % 7].toLowerCase() };
  }
  return { open: false, opensAt: null, opensDay: null };
}

export function formatHour(hhmm: string) {
  return hhmm.replace(":", "h");
}
