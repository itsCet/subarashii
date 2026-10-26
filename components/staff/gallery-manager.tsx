"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { addPhotos, deletePhoto, reorderPhotos, updatePhoto } from "@/app/actions/gallery";
import { Toaster, useToasts } from "@/components/ui/toaster";
import { uploadToMedia } from "@/lib/compress-image";
import { GALLERY_AREAS } from "@/lib/gallery";
import type { GalleryArea, GalleryPhoto } from "@/lib/supabase/database.types";
import { inputClass } from "./form";

type Props = { mode: "demo" | "live"; initialPhotos: GalleryPhoto[] };

export function GalleryManager({ mode, initialPhotos }: Props) {
  const demo = mode === "demo";
  const [photos, setPhotos] = useState(initialPhotos);
  const [area, setArea] = useState<GalleryArea>("cafe");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const { toasts, push } = useToasts();

  async function onFiles(files: File[]) {
    if (files.length === 0) return;
    setProgress({ done: 0, total: files.length });
    const urls: string[] = [];
    for (const file of files) {
      try {
        urls.push(demo ? URL.createObjectURL(file) : await uploadToMedia(file, "gallery"));
      } catch (e) {
        push(`${file.name} : ${(e as Error).message}`, "error");
      }
      setProgress((p) => p && { ...p, done: p.done + 1 });
    }
    setProgress(null);
    if (urls.length === 0) return;

    if (demo) {
      const now = new Date().toISOString();
      const added = urls.map((image_url) => ({
        id: crypto.randomUUID(), image_url, caption: "", area, sort_order: 0, is_published: true, created_at: now,
      }));
      setPhotos((list) => [...added, ...list]);
      return push(`${urls.length} photo${urls.length > 1 ? "s" : ""} ajoutée${urls.length > 1 ? "s" : ""} (démo)`, "info");
    }
    const result = await addPhotos(urls, area);
    if (!result.ok) return push(result.error, "error");
    setPhotos((list) => [...result.data, ...list]);
    push(`${urls.length} photo${urls.length > 1 ? "s" : ""} ajoutée${urls.length > 1 ? "s" : ""}`, "xp");
  }

  async function patch(photo: GalleryPhoto, change: Partial<Pick<GalleryPhoto, "caption" | "area" | "is_published">>) {
    setPhotos((list) => list.map((p) => (p.id === photo.id ? { ...p, ...change } : p)));
    if (demo) return;
    const result = await updatePhoto(photo.id, change);
    if (!result.ok) {
      setPhotos((list) => list.map((p) => (p.id === photo.id ? photo : p)));
      push(result.error, "error");
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...photos];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    const before = photos;
    setPhotos(next);
    if (demo) return;
    const result = await reorderPhotos(next.map((p) => p.id));
    if (!result.ok) {
      setPhotos(before);
      push(result.error, "error");
    }
  }

  async function remove(photo: GalleryPhoto) {
    if (!confirm("Supprimer cette photo du site ?")) return;
    setPhotos((list) => list.filter((p) => p.id !== photo.id));
    if (demo) return;
    const result = await deletePhoto(photo.id);
    if (!result.ok) {
      setPhotos((list) => [photo, ...list]);
      push(result.error, "error");
    }
  }

  return (
    <div>
      <Toaster toasts={toasts} />

      <section aria-labelledby="add-photos" className="border-[6px] border-black bg-charcoal p-4">
        <h2 id="add-photos" className="text-sm font-extrabold uppercase tracking-wider text-zinc-400">
          Ajouter des photos
        </h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <label className="sm:w-56">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">Zone</span>
            <select value={area} onChange={(e) => setArea(e.target.value as GalleryArea)} className={inputClass}>
              {GALLERY_AREAS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 border-2 border-dashed border-zinc-600 px-4 py-6 font-extrabold text-paper hover:border-paper ${
              progress ? "pointer-events-none opacity-70" : ""
            }`}
          >
            {progress ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            {progress ? `Envoi ${progress.done}/${progress.total}…` : "Choisir des photos (plusieurs possibles)"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                onFiles(files);
              }}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Les photos sont compressées automatiquement. La première de la liste est mise en avant sur l&apos;accueil.
        </p>
      </section>

      {photos.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-400">Aucune photo pour l&apos;instant : la section « Le café en images » reste masquée sur le site.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p, i) => (
            <li key={p.id} className={`border-2 bg-charcoal ${i === 0 ? "border-gold" : "border-zinc-700"}`}>
              <div className="relative aspect-[4/3] bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element -- image distante (Supabase Storage) */}
                <img src={p.image_url} alt={p.caption} className={`size-full object-cover ${p.is_published ? "" : "opacity-40"}`} />
                {i === 0 && <span className="absolute top-2 left-2 bg-gold px-2 py-0.5 text-[11px] font-extrabold uppercase text-black">À la une</span>}
                {!p.is_published && (
                  <span className="absolute top-2 right-2 bg-black px-2 py-0.5 text-[11px] font-extrabold uppercase text-white">Masquée</span>
                )}
              </div>
              <div className="space-y-2 p-3">
                <input
                  defaultValue={p.caption}
                  maxLength={120}
                  placeholder="Légende (facultatif)"
                  aria-label="Légende"
                  onBlur={(e) => e.target.value !== p.caption && patch(p, { caption: e.target.value.trim() })}
                  className={`${inputClass} py-2 text-sm`}
                />
                <select
                  value={p.area}
                  onChange={(e) => patch(p, { area: e.target.value as GalleryArea })}
                  aria-label="Zone"
                  className={`${inputClass} py-2 text-sm`}
                >
                  {GALLERY_AREAS.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <IconButton label="Monter" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp className="size-4" />
                  </IconButton>
                  <IconButton label="Descendre" onClick={() => move(i, 1)} disabled={i === photos.length - 1}>
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <IconButton label={p.is_published ? "Masquer" : "Publier"} onClick={() => patch(p, { is_published: !p.is_published })}>
                    {p.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </IconButton>
                  <IconButton label="Supprimer" onClick={() => remove(p)} className="ml-auto hover:text-torii-ink">
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  className = "",
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-9 place-items-center border-2 border-zinc-700 text-zinc-300 hover:border-paper hover:text-paper disabled:opacity-30 ${className}`}
    >
      {children}
    </button>
  );
}
