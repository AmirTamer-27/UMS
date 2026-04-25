import { createClient } from "@supabase/supabase-js";

import { env } from "../../config/env";

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || env.supabaseUrl;
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY || env.supabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
