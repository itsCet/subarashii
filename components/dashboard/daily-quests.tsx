"use client";

import { Check, Clock, Loader2 } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RewardIcon } from "@/components/ui/reward-icon";
import { useNow } from "@/lib/hooks/use-now";
import { formatChf } from "@/lib/game";
import type { PlayerQuest } from "@/lib/supabase/database.types";
import { formatDuration, secondsUntilZurichMidnight } from "@/lib/time";

type Props = {
  quests: PlayerQuest[];
  pendingId: string | null;
  onComplete: (quest: PlayerQuest) => void;
};

export function DailyQuests({ quests, pendingId, onComplete }: Props) {
  const now = useNow();
  const daily = quests.filter((q) => q.frequency === "daily");
  const weekly = quests.filter((q) => q.frequency === "weekly");

  return (
    <section aria-labelledby="quests-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="quests-title" className="font-display text-lg text-paper">
          Quêtes du jour
        </h2>
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <Clock className="size-3.5" />
          {now === null ? "…" : `Reset dans ${formatDuration(secondsUntilZurichMidnight(now))}`}
        </span>
      </div>

      <ul className="space-y-2.5">
        {daily.map((q) => (
          <QuestRow key={q.id} quest={q} pending={pendingId === q.id} onComplete={onComplete} />
        ))}
      </ul>

      {weekly.length > 0 && (
        <>
          <h3 className="mt-6 mb-3 text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">Hebdomadaire</h3>
          <ul className="space-y-2.5">
            {weekly.map((q) => (
              <QuestRow key={q.id} quest={q} pending={pendingId === q.id} onComplete={onComplete} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function QuestRow({
  quest,
  pending,
  onComplete,
}: {
  quest: PlayerQuest;
  pending: boolean;
  onComplete: (quest: PlayerQuest) => void;
}) {
  const ready = quest.progress >= quest.target_value;
  const showProgress = quest.verification !== "self";
  const progressLabel =
    quest.verification === "spend"
      ? `${formatChf(quest.progress)} / ${formatChf(quest.target_value)} CHF`
      : `${quest.progress} / ${quest.target_value}`;

  return (
    <li
      className={`flex items-center gap-3 rounded-sm border p-3 transition ${
        quest.completed
          ? "border-zinc-700/60 bg-zinc-900/30"
          : ready
            ? "border-torii bg-torii/5"
            : "border-zinc-700 bg-zinc-900/60"
      }`}
    >
      <div
        className={`grid size-11 shrink-0 place-items-center rounded-sm ${
          quest.completed ? "bg-zinc-800/60 text-zinc-500" : "bg-torii/15 text-torii"
        }`}
      >
        <RewardIcon icon={quest.icon_name} className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate text-sm font-semibold ${quest.completed ? "text-zinc-500 line-through" : "text-paper"}`}>
            {quest.title}
          </p>
          <span className="shrink-0 rounded-md bg-gold/10 px-1.5 py-0.5 text-[10px] font-bold text-gold">
            +{quest.xp_reward} XP
          </span>
        </div>
        <p className="truncate text-xs text-zinc-400">{quest.description}</p>
        {showProgress && !quest.completed && (
          <div className="mt-1.5 flex items-center gap-2">
            <ProgressBar value={quest.progress / quest.target_value} className="h-1.5 flex-1" label={quest.title} />
            <span className="shrink-0 text-[10px] tabular-nums text-zinc-400">{progressLabel}</span>
          </div>
        )}
      </div>

      {quest.completed ? (
        <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-emerald-500/10 text-ok" aria-label="Quête terminée">
          <Check className="size-5" />
        </span>
      ) : (
        <button
          type="button"
          disabled={!ready || pending}
          onClick={() => onComplete(quest)}
          className="min-w-[5.5rem] shrink-0 rounded-sm bg-torii px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-torii-bright active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {pending ? (
            <Loader2 className="mx-auto size-4 animate-spin" />
          ) : !ready ? (
            "En cours"
          ) : quest.verification === "self" ? (
            "Valider"
          ) : (
            "Réclamer"
          )}
        </button>
      )}
    </li>
  );
}
