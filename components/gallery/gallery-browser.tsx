"use client";

import { useState } from "react";
import { TabIndicator } from "@/components/ui/tab-indicator";
import { GALLERY_AREAS } from "@/lib/gallery";
import type { GalleryArea, GalleryPhoto } from "@/lib/supabase/database.types";
import { PhotoGrid } from "./photo-grid";

export function GalleryBrowser({ photos }: { photos: GalleryPhoto[] }) {
  const [area, setArea] = useState<GalleryArea | "all">("all");
  // Seules les zones qui ont des photos apparaissent en onglet.
  const tabs = [{ key: "all" as const, label: "Tout" }, ...GALLERY_AREAS.filter((a) => photos.some((p) => p.area === a.key))];
  const visible = area === "all" ? photos : photos.filter((p) => p.area === area);

  if (photos.length === 0) {
    return <p className="manga-panel p-6 text-center font-bold text-zinc-400">Les photos arrivent bientôt. En attendant, passe nous voir !</p>;
  }

  return (
    <>
      {tabs.length > 2 && (
        <div role="tablist" aria-label="Zones du café" className="scrollbar-none mb-6 flex gap-6 overflow-x-auto border-b border-zinc-800">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={area === t.key}
              onClick={() => setArea(t.key)}
              className={`relative shrink-0 py-3 text-sm font-extrabold ${area === t.key ? "text-paper" : "text-zinc-400 hover:text-zinc-300"}`}
            >
              {t.label}
              {area === t.key && <TabIndicator layoutId="gallery-tab" />}
            </button>
          ))}
        </div>
      )}
      {/* key : la grille (et son lightbox) repart de zéro quand on change de zone. */}
      <PhotoGrid key={area} photos={visible} />
    </>
  );
}
