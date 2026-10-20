"use client";

import { Loader2, Plus, Users } from "lucide-react";
import { useState } from "react";
import { type EventInput, deleteEvent, getEventRegistrations, saveEvent } from "@/app/actions/staff";
import { Toaster, useToasts } from "@/components/ui/toaster";
import { EVENT_CATEGORIES } from "@/lib/events-content";
import { formatChf } from "@/lib/game";
import type { StaffEvent } from "@/lib/supabase/database.types";
import { dateToZurichInputs, formatDateTimeShort, formatEventDate, formatEventTime, zurichLocalToDate } from "@/lib/time";
import { Field, Toggle, inputClass, primaryButton, secondaryButton } from "./form";
import { ImageField } from "./image-field";

type Props = { mode: "demo" | "live"; initialEvents: StaffEvent[] };

const EMPTY: EventInput = {
  title: "",
  category: "tcg",
  tag: "",
  date: "",
  time: "19:00",
  durationMin: 180,
  priceChf: 0,
  capacity: 20,
  conditions: "",
  description: "",
  imageUrl: null,
  isPublished: true,
};

function toInput(e: StaffEvent): EventInput {
  const { date, time } = dateToZurichInputs(e.starts_at);
  const duration = e.ends_at ? Math.round((Date.parse(e.ends_at) - Date.parse(e.starts_at)) / 60_000) : 180;
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    tag: e.tag ?? "",
    date,
    time,
    durationMin: duration,
    priceChf: e.price_chf,
    capacity: e.capacity,
    conditions: e.conditions ?? "",
    description: e.description,
    imageUrl: e.image_url,
    isPublished: e.is_published,
  };
}

export function EventManager({ mode, initialEvents }: Props) {
  const demo = mode === "demo";
  const [events, setEvents] = useState(initialEvents);
  const [editing, setEditing] = useState<EventInput | null>(null);
  const [registrations, setRegistrations] = useState<{ event: StaffEvent; list: { username: string | null; registered_at: string }[] } | null>(null);
  const { toasts, push } = useToasts();

  const [now] = useState(() => Date.now());
  const upcoming = events.filter((e) => Date.parse(e.ends_at ?? e.starts_at) >= now);
  const past = events.filter((e) => Date.parse(e.ends_at ?? e.starts_at) < now).reverse();

  async function onSaved(input: EventInput) {
    if (demo) {
      const startsAt = zurichLocalToDate(input.date, input.time);
      const event: StaffEvent = {
        id: input.id ?? crypto.randomUUID(),
        slug: input.title,
        title: input.title,
        description: input.description,
        category: input.category,
        tag: input.tag || null,
        starts_at: startsAt.toISOString(),
        ends_at: new Date(startsAt.getTime() + input.durationMin * 60_000).toISOString(),
        price_chf: input.priceChf,
        conditions: input.conditions || null,
        capacity: input.capacity,
        image_url: input.imageUrl,
        is_published: input.isPublished,
        registrations: events.find((e) => e.id === input.id)?.registrations ?? 0,
      };
      return upsert(event);
    }
    const result = await saveEvent(input);
    if (!result.ok) return result.error;
    upsert(result.data);
  }

  function upsert(event: StaffEvent) {
    setEvents((list) =>
      [...list.filter((e) => e.id !== event.id), event].sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at)),
    );
    setEditing(null);
    push(`« ${event.title} » enregistré`, "info");
  }

  async function remove(event: StaffEvent) {
    const warning = event.registrations > 0 ? ` ${event.registrations} inscription(s) seront perdues.` : "";
    if (!window.confirm(`Supprimer « ${event.title} » ?${warning}`)) return;
    if (!demo) {
      const result = await deleteEvent(event.id);
      if (!result.ok) return push(result.error, "error");
    }
    setEvents((list) => list.filter((e) => e.id !== event.id));
    setEditing(null);
    push("Événement supprimé", "info");
  }

  async function showRegistrations(event: StaffEvent) {
    if (demo) return setRegistrations({ event, list: [] });
    const result = await getEventRegistrations(event.id);
    if (!result.ok) return push(result.error, "error");
    setRegistrations({ event, list: result.data });
  }

  return (
    <div>
      <Toaster toasts={toasts} />

      {editing ? (
        <EventForm
          initial={editing}
          demo={demo}
          onCancel={() => setEditing(null)}
          onSubmit={onSaved}
          onDelete={editing.id ? () => remove(events.find((e) => e.id === editing.id)!) : undefined}
        />
      ) : (
        <button type="button" onClick={() => setEditing(EMPTY)} className={`${primaryButton} mb-6`}>
          <Plus className="size-4" /> Nouvel événement
        </button>
      )}

      {registrations && (
        <section className="mb-6 border-2 border-paper bg-charcoal p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-extrabold text-paper">Inscrits · {registrations.event.title}</h2>
            <button type="button" onClick={() => setRegistrations(null)} className="text-sm text-zinc-400 hover:text-paper">
              Fermer
            </button>
          </div>
          {registrations.list.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">{demo ? "Liste indisponible en mode démo." : "Personne pour l'instant."}</p>
          ) : (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-zinc-300">
              {registrations.list.map((r, i) => (
                <li key={i}>
                  <span className="font-bold text-paper">{r.username}</span>{" "}
                  <span className="text-xs text-zinc-500">· inscrit·e le {formatDateTimeShort(r.registered_at)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <EventList title="À venir" events={upcoming} onEdit={(e) => setEditing(toInput(e))} onRegistrations={showRegistrations} />
      {past.length > 0 && (
        <EventList title="Passés (30 derniers jours)" events={past} onEdit={(e) => setEditing(toInput(e))} onRegistrations={showRegistrations} muted />
      )}
    </div>
  );
}

function EventList({
  title,
  events,
  onEdit,
  onRegistrations,
  muted = false,
}: {
  title: string;
  events: StaffEvent[];
  onEdit: (e: StaffEvent) => void;
  onRegistrations: (e: StaffEvent) => void;
  muted?: boolean;
}) {
  return (
    <section className={`mb-8 ${muted ? "opacity-60" : ""}`}>
      <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-zinc-400">
        {title} · {events.length}
      </h2>
      {events.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun événement.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 border-y border-zinc-800">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-paper">
                  {e.title}
                  {!e.is_published && <span className="ml-2 text-xs font-bold text-gold">brouillon</span>}
                </p>
                <p className="text-xs text-zinc-400 first-letter:uppercase">
                  {formatEventDate(e.starts_at)} · {formatEventTime(e.starts_at)} ·{" "}
                  {e.price_chf === 0 ? "gratuit" : `${formatChf(e.price_chf)} CHF`}
                </p>
              </div>
              <button type="button" onClick={() => onRegistrations(e)} className="inline-flex items-center gap-1 text-sm text-zinc-300 hover:text-paper">
                <Users className="size-4" />
                {e.registrations}
                {e.capacity !== null && `/${e.capacity}`}
              </button>
              <button type="button" onClick={() => onEdit(e)} className={secondaryButton}>
                Modifier
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EventForm({
  initial,
  demo,
  onSubmit,
  onCancel,
  onDelete,
}: {
  initial: EventInput;
  demo: boolean;
  onSubmit: (input: EventInput) => Promise<string | void>;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [unlimited, setUnlimited] = useState(initial.capacity === null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const message = await onSubmit({ ...form, capacity: unlimited ? null : form.capacity });
    setPending(false);
    if (message) setError(message);
  }

  return (
    <form onSubmit={submit} className="mb-8 border-[6px] border-black bg-charcoal p-5">
      <h2 className="mb-5 font-display text-xl text-paper">{form.id ? "Modifier l'événement" : "Nouvel événement"}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Titre" htmlFor="ev-title" className="sm:col-span-2">
          <input id="ev-title" required maxLength={120} value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} placeholder="Tournoi One Piece TCG" />
        </Field>
        <Field label="Catégorie" htmlFor="ev-category">
          <select id="ev-category" value={form.category} onChange={(e) => set("category", e.target.value as EventInput["category"])} className={inputClass}>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Étiquette" htmlFor="ev-tag" hint="Affichée sur la carte : One Piece, Quiz, K-Pop…">
          <input id="ev-tag" maxLength={30} value={form.tag} onChange={(e) => set("tag", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Date" htmlFor="ev-date">
          <input id="ev-date" type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Heure" htmlFor="ev-time">
            <input id="ev-time" type="time" required value={form.time} onChange={(e) => set("time", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Durée (min)" htmlFor="ev-duration">
            <input id="ev-duration" type="number" min={15} step={15} required value={form.durationMin} onChange={(e) => set("durationMin", Number(e.target.value))} className={inputClass} />
          </Field>
        </div>
        <Field label="Tarif (CHF)" htmlFor="ev-price" hint="0 = gratuit">
          <input id="ev-price" type="number" min={0} step={0.5} required value={form.priceChf} onChange={(e) => set("priceChf", Number(e.target.value))} className={inputClass} />
        </Field>
        <Field label="Places" htmlFor="ev-capacity">
          <input id="ev-capacity" type="number" min={1} disabled={unlimited} value={form.capacity ?? ""} onChange={(e) => set("capacity", Number(e.target.value))} className={`${inputClass} disabled:opacity-40`} />
          <div className="mt-2">
            <Toggle id="ev-unlimited" label="Places illimitées" checked={unlimited} onChange={setUnlimited} />
          </div>
        </Field>
        <Field label="Conditions" htmlFor="ev-conditions" hint="Decklist, boisson incluse, âge minimum…" className="sm:col-span-2">
          <input id="ev-conditions" maxLength={200} value={form.conditions} onChange={(e) => set("conditions", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Description" htmlFor="ev-description" className="sm:col-span-2">
          <textarea id="ev-description" rows={3} maxLength={1000} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Affiche" htmlFor="ev-image" className="sm:col-span-2">
          <ImageField id="ev-image" value={form.imageUrl} onChange={(url) => set("imageUrl", url)} folder="events" demo={demo} />
        </Field>
        <div className="sm:col-span-2">
          <Toggle id="ev-published" label="Publié dans l'agenda" checked={form.isPublished} onChange={(v) => set("isPublished", v)} />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-torii">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Enregistrer
        </button>
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Annuler
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="ml-auto text-sm font-bold text-torii hover:underline">
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
}
