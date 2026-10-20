"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "code";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/pass";

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}` },
    });
    setPending(false);
    if (error) {
      console.error("[auth] signInWithOtp :", error.message);
      setError(
        error.status === 429
          ? "Trop de demandes. Patiente une minute avant de redemander un code."
          : "Envoi impossible. Vérifie l'adresse et réessaie.",
      );
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await createClient().auth.verifyOtp({ email, token: code.trim(), type: "email" });
    if (error) {
      setPending(false);
      setError("Code invalide ou expiré.");
      return;
    }
    router.replace(destination);
    router.refresh();
  }

  if (!isSupabaseConfigured) {
    return <p className="mt-8 text-sm text-zinc-500">Supabase n&apos;est pas configuré : l&apos;app fonctionne en mode démo.</p>;
  }

  const input =
    "w-full border-2 border-zinc-700 bg-ink px-3 py-3 text-paper outline-none placeholder:text-zinc-600 focus:border-paper";
  const button =
    "flex w-full items-center justify-center gap-2 border-2 border-black bg-torii py-3 text-sm font-extrabold text-paper shadow-panel transition hover:bg-torii-bright disabled:opacity-70";

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="mt-8 w-full space-y-3 text-left">
        <p className="text-sm text-zinc-300">
          C&apos;est envoyé à <strong className="text-paper">{email}</strong>. Clique sur le lien de l&apos;e-mail, ou saisis
          le code ici :
        </p>
        <label htmlFor="code" className="sr-only">
          Code reçu par e-mail
        </label>
        <input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,8}"
          maxLength={8}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          className={`${input} text-center font-display text-2xl tracking-[0.4em]`}
        />
        <button type="submit" disabled={pending} className={button}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Valider le code
        </button>
        {error && <p className="text-sm text-torii">{error}</p>}
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
            setError(null);
          }}
          className="text-sm text-zinc-400 underline underline-offset-4 hover:text-paper"
        >
          Changer d&apos;adresse ou renvoyer un code
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="mt-8 w-full space-y-3 text-left">
      <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
        E-mail
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="toi@exemple.ch"
        className={input}
      />
      <button type="submit" disabled={pending} className={button}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Recevoir mon code
      </button>
      {error && <p className="text-sm text-torii">{error}</p>}
    </form>
  );
}
