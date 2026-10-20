export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Sans variables Supabase, l'app tourne en mode démo avec des données locales. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
