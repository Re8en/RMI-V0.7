import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.startsWith('YOUR_') || supabaseAnonKey.startsWith('YOUR_')) {
  console.error(
    'Missing or invalid Supabase env vars! Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
  // Create a dummy client with a safe fallback to prevent crash
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
