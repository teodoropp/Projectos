import { createClient } from '@supabase/supabase-js';

const urlSupabase = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const chaveAnonimaSupabase = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!urlSupabase || !chaveAnonimaSupabase) {
  console.warn(
    'Supabase não configurado. Define EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no ficheiro .env.'
  );
}

export const supabase = createClient(urlSupabase, chaveAnonimaSupabase, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
