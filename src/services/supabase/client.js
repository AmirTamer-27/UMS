import { createClient } from "@supabase/supabase-js";

import { env } from "../../config/env";

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || env.supabaseUrl;
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY || env.supabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      // For local development, avoid automatic token refresh and URL session detection
      // which can trigger NavigatorLock contention in some browsers/React StrictMode.
      // Disable persisted sessions while developing to reduce navigator.lock usage.
      auth: {
        persistSession: import.meta.env.DEV ? false : true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

export default supabase;
