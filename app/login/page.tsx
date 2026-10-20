import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

const ERRORS: Record<string, string> = {
  expired: "Ce lien a expiré ou a déjà été utilisé. Demande un nouveau code ci-dessous.",
  browser:
    "Le lien s'est ouvert dans un autre navigateur que celui de ta demande. Saisis plutôt le code à 6 chiffres reçu par e-mail.",
  auth: "La connexion n'a pas abouti. Demande un nouveau code ci-dessous.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center pt-6 text-center">
      <Image src="/brand/logo.png" alt="Subarashii Manga Café" width={120} height={120} priority className="rounded-full" />
      <h1 className="mt-6 font-display text-2xl text-paper">Connexion</h1>
      <p className="mt-2 text-sm text-zinc-400">
        On t&apos;envoie un code par e-mail pour accéder à ton Pass et à ta carte membre. Pas de mot de passe.
      </p>
      {error && (
        <p role="alert" className="mt-4 w-full border-l-4 border-torii bg-torii/10 px-3 py-2 text-left text-sm text-paper">
          {ERRORS[error] ?? ERRORS.auth}
        </p>
      )}
      <LoginForm next={next} />
    </div>
  );
}
