"use client";

import { useState } from "react";
import { galleryAreaLabel } from "@/lib/gallery";
import type { GalleryPhoto } from "@/lib/supabase/database.types";
import { Lightbox } from "./lightbox";

/**
 * Planche de manga : cases séparées par des gouttières noires, la première en grand.
 * `layout="feature"` (accueil) : 1 grande case + petites ; `layout="grid"` (page galerie) : grille régulière.
 */
export function PhotoGrid({ photos, layout = "grid" }: { photos: GalleryPhoto[]; layout?: "feature" | "grid" }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <ul
        className={`grid gap-1.5 border-[6px] border-black bg-black ${
          layout === "feature" ? "grid-cols-2 sm:grid-cols-4 sm:grid-rows-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        }`}
      >
        {photos.map((p, i) => {
          const featured = layout === "feature" && i === 0;
          return (
            <li key={p.id} className={featured ? "col-span-2 row-span-2" : ""}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`Agrandir : ${p.caption || galleryAreaLabel(p.area)}`}
                className="group relative block size-full overflow-hidden bg-zinc-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- image distante (Supabase Storage) */}
                <img
                  src={p.image_url}
                  alt={p.caption || galleryAreaLabel(p.area)}
                  loading={i < 3 ? "eager" : "lazy"}
                  className={`w-full object-cover transition-transform duration-300 ease-snappy group-hover:scale-[1.03] ${
                    featured ? "aspect-square sm:h-full" : "aspect-square"
                  }`}
                />
                <span className="pointer-events-none absolute bottom-0 left-0 bg-black px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                  {galleryAreaLabel(p.area)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Lightbox photos={photos} index={open} onChange={setOpen} />
    </>
  );
}
