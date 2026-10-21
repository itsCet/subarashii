"use client";

import { useNow } from "@/lib/hooks/use-now";
import { OPENING_HOURS, WEEKDAYS } from "@/lib/cafe";
import { formatHour, openStatus, zurichClock } from "@/lib/opening-hours";

// Semaine affichée du lundi au dimanche.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function OpenStatusBadge() {
  const now = useNow();
  if (now === null) return <span className="inline-block h-5 w-40" />;

  const status = openStatus(now);
  return (
    <span className="inline-flex items-center gap-2 text-sm font-bold">
      <span className={`size-2.5 rounded-full ${status.open ? "bg-emerald-400" : "bg-torii"}`} />
      {status.open ? (
        <span className="text-paper">Ouvert · jusqu&apos;à {formatHour(status.closesAt)}</span>
      ) : (
        <span className="text-zinc-300">
          Fermé
          {status.opensAt && ` · ouvre ${status.opensDay ? `${status.opensDay} ` : ""}à ${formatHour(status.opensAt)}`}
        </span>
      )}
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
              className={`border-b border-zinc-800 last:border-0 ${isToday ? "text-paper" : "text-zinc-400"}`}
            >
              <th scope="row" className="py-2 text-left font-bold">
                {WEEKDAYS[day]}
                {isToday && <span className="ml-2 text-xs font-normal text-torii-ink">aujourd&apos;hui</span>}
              </th>
              <td className="py-2 text-right tabular-nums">
                {hours ? `${formatHour(hours.open)} – ${formatHour(hours.close)}` : <span className="text-zinc-400">Fermé</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
