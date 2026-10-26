import { createClient } from "./supabase/client";

// Réduit une photo avant envoi : les photos de téléphone font souvent 3 à 8 Mo,
// ramenées ici à ~300 Ko (WebP, 1800 px max) sans perte visible à l'écran.
export async function compressImage(file: File, maxSize = 1800, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".webp"), { type: "image/webp" });
  } catch {
    return file; // navigateur trop ancien : on envoie l'original
  }
}

/** Compresse puis envoie vers le bucket public `media` (5 Mo max) ; renvoie l'URL publique. */
export async function uploadToMedia(file: File, folder: string): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type)) {
    throw new Error("Format accepté : JPG, PNG ou WebP.");
  }
  const compressed = await compressImage(file);
  if (!["image/jpeg", "image/png", "image/webp"].includes(compressed.type)) throw new Error("Format accepté : JPG, PNG ou WebP.");
  if (compressed.size > 5 * 1024 * 1024) throw new Error("Image trop lourde, même compressée (5 Mo max).");

  const supabase = createClient();
  const ext = compressed.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, compressed, { contentType: compressed.type, cacheControl: "31536000" });
  if (error) {
    console.error("[upload]", error.message);
    throw new Error("Envoi impossible. Vérifie que le bucket « media » existe.");
  }
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
