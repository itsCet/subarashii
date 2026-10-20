import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Accepte les deux formats de lien Supabase :
//  - `?token_hash=…&type=…` (recommandé : fonctionne même si le lien s'ouvre dans un autre navigateur)
//  - `?code=…` (PKCE : le lien doit s'ouvrir dans le navigateur qui a fait la demande)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const fail = (reason: string) => NextResponse.redirect(`${origin}/login?error=${reason}&next=${encodeURIComponent(next)}`);

  // Supabase renvoie ses propres erreurs dans l'URL (lien expiré, déjà utilisé…).
  const supabaseError = searchParams.get("error_code") ?? searchParams.get("error");
  if (supabaseError) {
    console.error("[auth] erreur Supabase :", supabaseError, searchParams.get("error_description"));
    return fail(supabaseError === "otp_expired" ? "expired" : "auth");
  }

  const supabase = await createClient();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth] verifyOtp :", error.message);
    return fail("expired");
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth] exchangeCodeForSession :", error.message);
    // Le cas typique : lien ouvert dans un autre navigateur que celui de la demande.
    return fail(/verifier/i.test(error.message) ? "browser" : "expired");
  }

  return fail("auth");
}

// Évite les redirections ouvertes : uniquement des chemins internes.
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/pass";
}
