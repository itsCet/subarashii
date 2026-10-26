import type { Metadata } from "next";
import { GalleryManager } from "@/components/staff/gallery-manager";
import { getGalleryPhotos } from "@/lib/data/gallery";
import { getStaffAccess } from "@/lib/data/staff";

export const metadata: Metadata = { title: "Photos" };

export default async function StaffPhotosPage() {
  const access = await getStaffAccess();
  if (access.status !== "ok") return null;

  // Le staff voit aussi les photos masquées (RLS).
  const photos = await getGalleryPhotos();
  return <GalleryManager mode={access.mode} initialPhotos={photos} />;
}
