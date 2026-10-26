"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { galleryAreaLabel } from "@/lib/gallery";
import type { GalleryPhoto } from "@/lib/supabase/database.types";

type Props = { photos: GalleryPhoto[]; index: number | null; onChange: (index: number | null) => void };

const EASE = [0.23, 1, 0.32, 1] as const;

/** Photo en plein écran : flèches, clavier (← → Échap) et glissement du doigt. */
export function Lightbox({ photos, index, onChange }: Props) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const open = index !== null;
  const photo = open ? photos[index] : null;

  const go = (dir: 1 | -1) => index !== null && onChange((index + dir + photos.length) % photos.length);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  });

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo du café"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15, ease: EASE } }}
          transition={{ duration: 0.2, ease: EASE }}
          className="fixed inset-0 z-[80] flex flex-col bg-black pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          onClick={(e) => e.target === e.currentTarget && onChange(null)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-bold tabular-nums text-white/70">
              {index! + 1} / {photos.length}
            </span>
            <button ref={closeRef} type="button" onClick={() => onChange(null)} aria-label="Fermer" className="grid size-11 place-items-center border-2 border-white/30 hover:border-white">
              <X className="size-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={photo.id}
                src={photo.image_url}
                alt={photo.caption || galleryAreaLabel(photo.area)}
                initial={{ opacity: 0, transform: reduceMotion ? "scale(1)" : "scale(0.97)" }}
                animate={{ opacity: 1, transform: "scale(1)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="max-h-full max-w-full border-4 border-white object-contain"
              />
            </AnimatePresence>
            {photos.length > 1 && (
              <>
                <NavButton label="Photo précédente" onClick={() => go(-1)} className="left-2">
                  <ChevronLeft className="size-6" />
                </NavButton>
                <NavButton label="Photo suivante" onClick={() => go(1)} className="right-2">
                  <ChevronRight className="size-6" />
                </NavButton>
              </>
            )}
          </div>

          <p className="px-4 py-4 text-center text-sm text-white">
            <span className="font-extrabold uppercase tracking-wider text-white/60">{galleryAreaLabel(photo.area)}</span>
            {photo.caption && <> · {photo.caption}</>}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavButton({ label, onClick, className, children }: { label: string; onClick: () => void; className: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 hidden size-12 -translate-y-1/2 place-items-center border-2 border-white/30 bg-black/60 text-white hover:border-white sm:grid ${className}`}
    >
      {children}
    </button>
  );
}
