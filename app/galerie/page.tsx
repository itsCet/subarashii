import type { Metadata } from "next";
import { GalleryBrowser } from "@/components/gallery/gallery-browser";
import { getGalleryPhotos } from "@/lib/data/gallery";

export const metadata: Metadata = {
  title: "Le café en images",
  description: "Bibliothèque, alcôves, bar, gaming et soirées : découvre le Subarashii Manga Café de Genève en photos.",
};

export default async function GalleryPage() {
  const photos = (await getGalleryPhotos()).filter((p) => p.is_published);
  return (
    <div>
      <header className="mb-6 border-b-2 border-paper pb-4">
        <h1 className="font-display text-4xl text-paper">Le café en images</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Bibliothèque, alcôves, bar, zone gaming et soirées : un aperçu du Suba avant de passer la porte, Rue de Lyon 75-77.
        </p>
      </header>
      <GalleryBrowser photos={photos} />
    </div>
  );
}
