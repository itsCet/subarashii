import { PhotoGrid } from "@/components/gallery/photo-grid";
import { SectionTitle } from "@/components/ui/section-title";
import type { GalleryPhoto } from "@/lib/supabase/database.types";

/** « Le café en images » : masquée tant que le staff n'a publié aucune photo. */
export function GalleryTeaser({ photos }: { photos: GalleryPhoto[] }) {
  if (photos.length === 0) return null;
  return (
    <section aria-labelledby="gallery-title">
      <SectionTitle
        index="02"
        title="Le café en images"
        id="gallery-title"
        aside="写真"
        action={photos.length > 5 ? { href: "/galerie", label: "Toutes les photos" } : undefined}
      />
      <PhotoGrid photos={photos.slice(0, 5)} layout="feature" />
    </section>
  );
}
