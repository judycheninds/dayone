import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when Supabase env vars are present, so cloud auth + sync are available. */
export const isCloudEnabled = Boolean(url && anonKey);

/**
 * Supabase client, or null when not configured.
 * When null the app runs in local-first "guest" mode.
 */
export const supabase: SupabaseClient | null = isCloudEnabled
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
