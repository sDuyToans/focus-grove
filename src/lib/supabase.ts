import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client — created once at startup from Vite env vars.
 *
 *   VITE_SUPABASE_URL       your project URL (https://xyz.supabase.co)
 *   VITE_SUPABASE_ANON_KEY  the public *anon* key
 *
 * ⚠️  Only the anon key ever belongs in the frontend. The service-role
 *     key bypasses Row Level Security — never expose it here. Data is
 *     protected by the RLS policies in supabase/schema.sql instead.
 *
 * When the vars are missing the client is `null` and the app falls back
 * to mock mode (see src/auth/index.ts); when only ONE is set we surface
 * a friendly configuration error instead of failing silently.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when both env vars are present and the client exists. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/** A friendly startup message when the config is half-finished. */
export const supabaseConfigError: string | null =
  !url !== !anonKey // exactly one of the two is set
    ? 'Supabase is only half-configured — please set both VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_ANON_KEY in .env.local, then restart the dev server.'
    : null

/** The shared client, or null when running without Supabase. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true, // session survives reloads (localStorage)
        autoRefreshToken: true, // silently refresh expired tokens
        detectSessionInUrl: true, // completes the OAuth redirect flow
      },
    })
  : null

/**
 * Get the client or throw — for call sites that only run when
 * Supabase mode is active.
 */
export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured (see .env.example)')
  return supabase
}
