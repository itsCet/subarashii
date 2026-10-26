"use server";

import { revalidatePath } from "next/cache";
import { GALLERY_AREAS } from "@/lib/gallery";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { GalleryArea, GalleryPhoto } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./battle-pass";

// Les droits sont garantis par la RLS (écriture réservée au personnel).
const DEMO = { ok: false, error: "Mode démo : Supabase non configuré." } as const;
const FAILED = { ok: false, error: "Enregistrement impossible (droits insuffisants ?)." } as const;

const refresh = () => {
  revalidatePath("/");
  revalidatePath("/galerie");
};

export async function addPhotos(urls: string[], area: GalleryArea): Promise<ActionResult<GalleryPhoto[]>> {
  if (!isSupabaseConfigured) return DEMO;
  if (!GALLERY_AREAS.some((a) => a.key === area)) return { ok: false, error: "Zone invalide." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_photos")
    .insert(urls.map((image_url) => ({ image_url, area })))
    .select();
  if (error) return FAILED;
  refresh();
  return { ok: true, data: data ?? [] };
}

export async function updatePhoto(
  id: string,
  patch: Partial<Pick<GalleryPhoto, "caption" | "area" | "is_published">>,
): Promise<ActionResult<GalleryPhoto>> {
  if (!isSupabaseConfigured) return DEMO;
  if (patch.caption !== undefined && patch.caption.length > 120) return { ok: false, error: "Légende trop longue (120 max)." };
  if (patch.area !== undefined && !GALLERY_AREAS.some((a) => a.key === patch.area)) return { ok: false, error: "Zone invalide." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("gallery_photos").update(patch).eq("id", id).select().single();
  if (error) return FAILED;
  refresh();
  return { ok: true, data };
}

/** Nouvel ordre d'affichage (la première photo est mise en avant sur l'accueil). */
export async function reorderPhotos(ids: string[]): Promise<ActionResult> {
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createClient();
  const results = await Promise.all(ids.map((id, i) => supabase.from("gallery_photos").update({ sort_order: i }).eq("id", id)));
  if (results.some((r) => r.error)) return FAILED;
  refresh();
  return { ok: true, data: undefined };
}

export async function deletePhoto(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
  if (error) return { ok: false, error: "Suppression impossible." };
  refresh();
  return { ok: true, data: undefined };
}
