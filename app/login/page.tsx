import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center pt-6 text-center">
      <Image src="/brand/logo.png" alt="Subarashii Manga Café" width={160} height={160} priority className="rounded-full" />
      <h1 className="mt-6 font-display text-2xl text-white">Rejoins la saison</h1>
      <p className="mt-2 text-sm text-slate-400">
        Reçois un lien de connexion par e-mail pour accéder à ton Pass de Combat et ta carte membre.
      </p>
      {error && (
        <p className="mt-4 w-full rounded-lg border border-neon-pink/50 bg-neon-pink/10 px-3 py-2 text-sm text-pink-200">
          Le lien de connexion est invalide ou a expiré.
        </p>
      )}
      <LoginForm />
    </div>
  );
}
