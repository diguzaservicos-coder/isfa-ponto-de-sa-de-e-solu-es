import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Só a chave pública ("anon") vai para o navegador. Nunca use a chave "service_role" aqui.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
export const PHOTO_BUCKET = "product-photos";

export function photoUrl(path: string): string {
  if (!supabase) return "";
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}
