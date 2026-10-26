import "server-only";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { GalleryPhoto } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/** Photos du café : publiées pour le public, toutes pour le staff (RLS). */
export async function getGalleryPhotos(limit = 200): Promise<GalleryPhoto[]> {
  await connection();
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gallery_photos")
      .select("*")
      .order("sort_order")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    unstable_rethrow(error);
    console.error("[gallery] chargement impossible :", error);
    return [];
  }
}
