"use client";

import { CameraOff, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type Props = {
  onScan: (text: string) => void;
  onClose: () => void;
};

/** Lecteur de QR code via la caméra arrière (html5-qrcode, chargé à la demande). */
export function QrScanner({ onScan, onClose }: Props) {
  const regionId = `qr-${useId().replace(/:/g, "")}`;
  const [error, setError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let stopped = false;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (stopped) return;
      scanner = new Html5Qrcode(regionId, { verbose: false });
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: (w, h) => ({ width: Math.min(w, h) * 0.7, height: Math.min(w, h) * 0.7 }) },
          (text) => {
            if (stopped) return;
            stopped = true;
            scanner?.stop().catch(() => {});
            onScanRef.current(text);
          },
          () => {},
        );
      } catch (e) {
        console.error("[scanner]", e);
        setError(
          window.isSecureContext
            ? "Caméra indisponible. Autorise l'accès à la caméra dans le navigateur, ou cherche le membre par pseudo."
            : "La caméra nécessite une connexion sécurisée (https).",
        );
      }
    })();

    return () => {
      stopped = true;
      if (scanner?.isScanning) scanner.stop().catch(() => {});
    };
  }, [regionId]);

  return (
    <div className="relative border-[6px] border-black bg-black">
      <div id={regionId} className="aspect-square w-full overflow-hidden [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-charcoal p-6 text-center">
          <div>
            <CameraOff className="mx-auto size-8 text-torii" />
            <p className="mt-3 text-sm text-zinc-300">{error}</p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer le scanner"
        className="absolute top-2 right-2 grid size-10 place-items-center border-2 border-black bg-paper text-ink"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
