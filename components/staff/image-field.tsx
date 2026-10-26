"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { uploadToMedia } from "@/lib/compress-image";

type Props = {
  id: string;
  value: string | null;
  onChange: (url: string | null) => void;
  folder: "events" | "products";
  demo: boolean;
};

/** Envoi d'image (compressée) vers le bucket public `media` de Supabase Storage. */
export function ImageField({ id, value, onChange, folder, demo }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (demo) return onChange(URL.createObjectURL(file));
    setPending(true);
    try {
      onChange(await uploadToMedia(file, folder));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      {value ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- image distante (Supabase Storage) */}
          <img src={value} alt="" className="size-24 border-2 border-zinc-700 object-cover" />
          <button type="button" onClick={() => onChange(null)} className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-torii-ink">
            <Trash2 className="size-4" /> Retirer
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center gap-2 border-2 border-dashed border-zinc-700 px-3 py-4 text-sm text-zinc-400 hover:border-paper hover:text-paper"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {pending ? "Envoi…" : "Ajouter une photo"}
        </label>
      )}
      <input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />
      {error && <p className="mt-1 text-xs text-torii-ink">{error}</p>}
    </div>
  );
}
