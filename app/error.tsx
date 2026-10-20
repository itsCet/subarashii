"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="manga-panel halftone-torii mx-auto max-w-md rounded-2xl p-6 text-center shadow-panel">
      <Image src="/brand/logo.png" alt="" width={96} height={96} className="mx-auto rounded-full" />
      <h1 className="mt-4 font-display text-2xl text-paper">Oups, page en panne</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Cette page n&apos;a pas pu se charger. Réessaie dans un instant ou reviens à l&apos;accueil.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-torii px-4 py-2 text-sm font-extrabold text-paper shadow-panel"
        >
          <RotateCcw className="size-4" /> Réessayer
        </button>
        <Link href="/" className="rounded-xl border-2 border-zinc-600 px-4 py-2 text-sm font-extrabold text-paper">
          Accueil
        </Link>
      </div>
    </section>
  );
}
