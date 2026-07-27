import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthError, type AuthAdapter } from './types'
import type { User } from '../types'

/**
 * supabaseAdapter — real Google sign-in via Supabase OAuth.
 *
 * Flow (redirect-based, works on iPad/mobile where popups are flaky):
 *   1. signInWithGoogle() → supabase.auth.signInWithOAuth() redirects
 *      the whole page to Google's consent screen.
 *   2. Google redirects back to the app; the client (configured with
 *      detectSessionInUrl) picks the tokens out of the URL.
 *   3. onAuthStateChange fires with the new session → AuthContext
 *      updates → the app switches to the signed-in view.
 *
 * Setup checklist:
 *   - Supabase dashboard → Authentication → Providers → enable Google
 *     (Google Cloud OAuth client ID + secret).
 *   - Authentication → URL Configuration → add your dev and production
 *     URLs (e.g. http://localhost:5173 and https://yourapp.com) to the
 *     redirect allow-list, and set the Site URL for production.
 *   - .env.local: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.
 */

/** Map a Supabase auth user onto the app's own User shape. */
function toUser(u: SupabaseUser | null): User | null {
  if (!u) return null
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  return {
    id: u.id,
    name: str(meta.full_name) || str(meta.name) || u.email?.split('@')[0] || 'Friend',
    email: u.email ?? '',
    avatarUrl: str(meta.avatar_url) || str(meta.picture),
  }
}

export const supabaseAdapter: AuthAdapter = {
  name: 'supabase',

  onAuthStateChanged(onUser) {
    if (!supabase) {
      onUser(null)
      return () => {}
    }
    // 1) restore any persisted session on load…
    void supabase.auth
      .getSession()
      .then(({ data }) => onUser(toUser(data.session?.user ?? null)))
      .catch(() => onUser(null))
    // 2) …then follow every subsequent change (sign-in redirect return,
    //    token refresh, sign-out in another tab, expired session)
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      onUser(toUser(session?.user ?? null))
    })
    return () => data.subscription.unsubscribe()
  },

  async signInWithGoogle() {
    if (!supabase) {
      throw new AuthError(
        'unknown',
        'Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
          'in .env.local (see .env.example), or use VITE_AUTH_PROVIDER=mock.',
      )
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // come back to wherever the app is served from (dev or prod);
        // this URL must be in Supabase's redirect allow-list
        redirectTo: window.location.origin,
      },
    })
    if (error) throw new AuthError('network', error.message)
    // the page is about to navigate to Google — never resolve so the
    // "Signing in…" state stays visible until we leave
    return new Promise<User>(() => {})
  },

  async signOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw new AuthError('network', error.message)
  },
}
