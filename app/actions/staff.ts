"use server";

import { normalizeProduct } from "@/lib/data/products";
import { EVENT_CATEGORIES } from "@/lib/events-content";
import { PRODUCT_CATEGORIES } from "@/lib/products-content";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { EventCategory, Product, ProductCategory, StaffEvent } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { zurichLocalToDate } from "@/lib/time";
import type { ActionResult } from "./battle-pass";

// Les droits sont garantis côté base (RLS + fonctions `security definer`) ;
// les contrôles ici servent à renvoyer des messages clairs au personnel.

const DEMO = { ok: false, error: "Mode démo : Supabase non configuré." } as const;

const ERRORS: Record<string, string> = {
  FORBIDDEN: "Accès réservé au personnel.",
  SELF_TRANSACTION: "Impossible de créditer ton propre compte.",
  INVALID_AMOUNT: "Montant invalide.",
  MEMBER_NOT_FOUND: "Membre introuvable.",
};
const toError = (message?: string) => ERRORS[message ?? ""] ?? "Une erreur est survenue. Réessaie.";

// -----------------------------------------------------------------------------
// Caisse
// -----------------------------------------------------------------------------

export type MemberSummary = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  current_season_spent: number;
  is_premium_pass: boolean;
};

const MEMBER_COLUMNS = "id, username, avatar_url, xp, level, current_season_spent, is_premium_pass";
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Recherche par pseudo, ou par identifiant (contenu d'un QR code de carte membre). */
export async function findMembers(query: string): Promise<ActionResult<MemberSummary[]>> {
  if (!isSupabaseConfigured) return DEMO;
  const q = query.trim();
  if (!q) return { ok: true, data: [] };

  const supabase = await createClient();
  const uuid = q.match(UUID)?.[0];
  const request = supabase.from("profiles").select(MEMBER_COLUMNS).limit(8);
  const { data, error } = uuid
    ? await request.eq("id", uuid.toLowerCase())
    : await request.ilike("username", `%${q.replace(/[%_]/g, "")}%`).order("username");
  if (error) return { ok: false, error: toError(error.message) };
  return {
    ok: true,
    data: (data ?? []).map((m) => ({ ...m, current_season_spent: Number(m.current_season_spent) })),
  };
}

export type TransactionReceipt = {
  username: string | null;
  amount_chf: number;
  xp_gained: number;
  xp: number;
  level_before: number;
  level: number;
  current_season_spent: number;
  is_premium_pass: boolean;
  premium_unlocked: boolean;
};

export async function recordTransaction(memberId: string, amountChf: number): Promise<ActionResult<TransactionReceipt>> {
  if (!isSupabaseConfigured) return DEMO;
  if (!Number.isFinite(amountChf) || amountChf <= 0 || amountChf > 10_000) return { ok: false, error: ERRORS.INVALID_AMOUNT };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_transaction", {
    p_user_id: memberId,
    p_amount_chf: Math.round(amountChf * 100) / 100,
  });
  if (error) return { ok: false, error: toError(error.message) };
  const r = data as unknown as TransactionReceipt;
  return {
    ok: true,
    data: { ...r, amount_chf: Number(r.amount_chf), current_season_spent: Number(r.current_season_spent) },
  };
}

// -----------------------------------------------------------------------------
// Agenda
// -----------------------------------------------------------------------------

export type EventInput = {
  id?: string;
  title: string;
  category: EventCategory;
  tag: string;
  date: string; // AAAA-MM-JJ (heure de Genève)
  time: string; // HH:MM
  durationMin: number;
  priceChf: number;
  capacity: number | null;
  conditions: string;
  description: string;
  imageUrl: string | null;
  isPublished: boolean;
};

function validateEvent(input: EventInput): string | null {
  if (!input.title.trim() || input.title.length > 120) return "Titre obligatoire (120 caractères max).";
  if (!EVENT_CATEGORIES.some((c) => c.key === input.category)) return "Catégorie invalide.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) return "Date ou heure invalide.";
  if (!Number.isFinite(input.durationMin) || input.durationMin < 15 || input.durationMin > 24 * 60) return "Durée invalide.";
  if (!Number.isFinite(input.priceChf) || input.priceChf < 0) return "Tarif invalide.";
  if (input.capacity !== null && (!Number.isInteger(input.capacity) || input.capacity < 1)) return "Nombre de places invalide.";
  return null;
}

const slugify = (title: string) =>
  title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

export async function saveEvent(input: EventInput): Promise<ActionResult<StaffEvent>> {
  if (!isSupabaseConfigured) return DEMO;
  const invalid = validateEvent(input);
  if (invalid) return { ok: false, error: invalid };

  const startsAt = zurichLocalToDate(input.date, input.time);
  const row = {
    title: input.title.trim(),
    category: input.category,
    tag: input.tag.trim() || null,
    starts_at: startsAt.toISOString(),
    ends_at: new Date(startsAt.getTime() + input.durationMin * 60_000).toISOString(),
    price_chf: Math.round(input.priceChf * 100) / 100,
    capacity: input.capacity,
    conditions: input.conditions.trim() || null,
    description: input.description.trim(),
    image_url: input.imageUrl,
    is_published: input.isPublished,
  };

  const supabase = await createClient();
  const { data, error } = input.id
    ? await supabase.from("events").update(row).eq("id", input.id).select().single()
    : await supabase
        .from("events")
        .insert({ ...row, slug: `${slugify(row.title)}-${crypto.randomUUID().slice(0, 6)}` })
        .select()
        .single();
  if (error) {
    console.error("[staff] saveEvent :", error.message);
    return { ok: false, error: "Enregistrement impossible (droits insuffisants ?)." };
  }

  const { count } = await supabase
    .from("event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", data.id);
  return { ok: true, data: { ...data, price_chf: Number(data.price_chf), registrations: count ?? 0 } };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { ok: false, error: "Suppression impossible." };
  return { ok: true, data: undefined };
}

export async function getEventRegistrations(
  eventId: string,
): Promise<ActionResult<{ username: string | null; registered_at: string }[]>> {
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_event_registrations", { p_event_id: eventId });
  if (error) return { ok: false, error: toError(error.message) };
  return { ok: true, data: data ?? [] };
}

// -----------------------------------------------------------------------------
// Shop
// -----------------------------------------------------------------------------

export type ProductInput = {
  id?: string;
  name: string;
  category: ProductCategory;
  description: string;
  priceChf: number;
  stock: number | null;
  imageUrl: string | null;
  isNew: boolean;
  isPublished: boolean;
};

export async function saveProduct(input: ProductInput): Promise<ActionResult<Product>> {
  if (!isSupabaseConfigured) return DEMO;
  if (!input.name.trim() || input.name.length > 120) return { ok: false, error: "Nom obligatoire (120 caractères max)." };
  if (!PRODUCT_CATEGORIES.some((c) => c.key === input.category)) return { ok: false, error: "Catégorie invalide." };
  if (!Number.isFinite(input.priceChf) || input.priceChf < 0) return { ok: false, error: "Prix invalide." };
  if (input.stock !== null && (!Number.isInteger(input.stock) || input.stock < 0)) return { ok: false, error: "Stock invalide." };

  const row = {
    name: input.name.trim(),
    category: input.category,
    description: input.description.trim(),
    price_chf: Math.round(input.priceChf * 100) / 100,
    stock: input.stock,
    image_url: input.imageUrl,
    is_new: input.isNew,
    is_published: input.isPublished,
  };

  const supabase = await createClient();
  const { data, error } = input.id
    ? await supabase.from("products").update(row).eq("id", input.id).select().single()
    : await supabase.from("products").insert(row).select().single();
  if (error) {
    console.error("[staff] saveProduct :", error.message);
    return { ok: false, error: "Enregistrement impossible (droits insuffisants ?)." };
  }
  return { ok: true, data: normalizeProduct(data) };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: "Suppression impossible." };
  return { ok: true, data: undefined };
}
