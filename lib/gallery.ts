import type { GalleryArea } from "./supabase/database.types";

export const GALLERY_AREAS: { key: GalleryArea; label: string }[] = [
  { key: "cafe", label: "Le café" },
  { key: "bibliotheque", label: "Bibliothèque" },
  { key: "alcoves", label: "Alcôves" },
  { key: "bar", label: "Bar & fooding" },
  { key: "gaming", label: "Gaming" },
  { key: "tcg", label: "TCG" },
  { key: "evenements", label: "Événements" },
];

export const galleryAreaLabel = (a: GalleryArea) => GALLERY_AREAS.find((x) => x.key === a)?.label ?? a;
