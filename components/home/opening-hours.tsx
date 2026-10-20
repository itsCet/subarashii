"use client";

import { useNow } from "@/lib/hooks/use-now";
import { OPENING_HOURS, WEEKDAYS } from "@/lib/cafe";
import { formatHour, openStatus, zurichClock } from "@/lib/opening-hours";

// Semaine affichée du lundi au dimanche.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function OpenStatusBadge() {
  const now = useNow();
  if (now === null) return <span className="inline-block h-8 w-44 animate-pulse rounded-full bg-zinc-800" />;

  const status = openStatus(now);
  return status.open ? (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-bold text-emerald-400">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
      </span>
      Ouvert actuellement · jusqu&apos;à {formatHour(status.closesAt)}
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full border border-torii/40 bg-torii/10 px-3 py-1.5 text-sm font-bold text-red-300">
      <span className="size-2.5 rounded-full bg-torii" />
      Fermé
      {status.opensAt && ` · ouvre ${status.opensDay ? `${status.opensDay} ` : ""}à ${formatHour(status.opensAt)}`}
    </span>
  );
}

export function HoursTable() {
  const now = useNow();
  const today = now === null ? null : zurichClock(now).day;

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Horaires d&apos;ouverture</caption>
      <tbody>
        {ORDER.map((day) => {
          const hours = OPENING_HOURS[day];
          const isToday = day === today;
          return (
            <tr
              key={day}
              aria-current={isToday ? "date" : undefined}
              className={`border-b border-dashed border-zinc-800 last:border-0 ${isToday ? "text-paper" : "text-zinc-400"}`}
            >
              <th scope="row" className="py-2 text-left font-bold">
                {WEEKDAYS[day]}
                {isToday && <span className="ml-2 rounded bg-torii px-1.5 py-0.5 text-[10px] text-paper">Aujourd&apos;hui</span>}
              </th>
              <td className="py-2 text-right tabular-nums">
                {hours ? `${formatHour(hours.open)} – ${formatHour(hours.close)}` : <span className="text-zinc-600">Fermé</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
