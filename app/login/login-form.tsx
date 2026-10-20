"use client";

import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}` },
    });
    setStatus(error ? "error" : "sent");
  }

  if (!isSupabaseConfigured) {
    return (
      <p className="mt-8 text-sm text-zinc-500">
        Supabase n&apos;est pas configuré : l&apos;app fonctionne en mode démo.
      </p>
    );
  }

  if (status === "sent") {
    return (
      <p className="mt-8 rounded-xl border border-torii/50 bg-torii/10 p-4 text-sm text-paper">
        Lien envoyé à <strong>{email}</strong> ! Ouvre-le sur cet appareil pour te connecter.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 w-full space-y-3 text-left">
      <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        E-mail
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/70 px-3 focus-within:border-torii focus-within:shadow-card">
        <Mail className="size-4 text-zinc-500" />
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="otaku@exemple.ch"
          className="w-full bg-transparent py-3 text-paper outline-none placeholder:text-zinc-600"
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-torii py-3 text-sm font-bold uppercase tracking-wider text-paper shadow-torii transition hover:brightness-110 disabled:opacity-70"
      >
        {status === "sending" && <Loader2 className="size-4 animate-spin" />}
        Recevoir mon lien
      </button>
      {status === "error" && <p className="text-sm text-sakura">Envoi impossible. Vérifie l&apos;adresse et réessaie.</p>}
    </form>
  );
}
