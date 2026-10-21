"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export const INTRO_STORAGE_KEY = "subarashii:intro-seen";

/** Script inline (dans <head>) qui masque l'intro avant le premier rendu si elle a déjà été vue. */
export const introSeenScript = `try{if(sessionStorage.getItem("${INTRO_STORAGE_KEY}"))document.documentElement.dataset.introSeen=""}catch(e){}`;

export function IntroSplash() {
  const [visible, setVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Déjà vue dans cette session : masquée en CSS par `introSeenScript`.
    if (document.documentElement.hasAttribute("data-intro-seen")) {
      videoRef.current?.pause();
      return;
    }
    // Filet de sécurité si la vidéo ne se lance pas (mode économie d'énergie, etc.).
    const timeout = setTimeout(dismiss, 6500);
    videoRef.current?.play().catch(dismiss);
    return () => clearTimeout(timeout);
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="intro-splash"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          onClick={dismiss}
        >
          <video
            ref={videoRef}
            className="aspect-square w-[min(80vw,26rem)]"
            muted
            playsInline
            autoPlay
            preload="auto"
            onEnded={dismiss}
          >
            <source src="/brand/logo-intro.mp4" type="video/mp4" />
            <source src="/brand/logo-intro.webm" type="video/webm" onError={dismiss} />
          </video>
          <button
            type="button"
            onClick={dismiss}
            className="absolute bottom-10 rounded-full border border-white/25 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-torii hover:text-white"
          >
            Passer
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
