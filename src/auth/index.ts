import { isSupabaseConfigured } from '../lib/supabase'
import { firebaseAdapter } from './firebaseAdapter'
import { mockAdapter } from './mockAdapter'
import { supabaseAdapter } from './supabaseAdapter'
import type { AuthAdapter } from './types'

/**
 * Auth backend selection.
 *
 * - VITE_AUTH_PROVIDER (mock | firebase | supabase) always wins.
 * - With no explicit provider, Supabase is used automatically when its
 *   env vars are present in .env.local — so filling in the keys is all
 *   it takes to go live.
 * - With no provider and no keys, the app runs in mock mode so it
 *   always works without credentials.
 */
const explicit = import.meta.env.VITE_AUTH_PROVIDER as string | undefined
const provider = explicit ?? (isSupabaseConfigured ? 'supabase' : 'mock')

export const authAdapter: AuthAdapter =
  provider === 'firebase' ? firebaseAdapter : provider === 'supabase' ? supabaseAdapter : mockAdapter

/** True when the app is talking to a real Supabase backend (auth + data sync). */
export const isCloudMode = provider === 'supabase' && isSupabaseConfigured

export * from './types'
