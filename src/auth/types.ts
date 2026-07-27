import type { User } from '../types'

/**
 * AuthAdapter — the abstraction every auth backend implements.
 *
 * The app only ever talks to this interface (via AuthContext), so
 * swapping mock → Firebase → Supabase is a one-line env change:
 *
 *   VITE_AUTH_PROVIDER=mock | firebase | supabase   (see src/auth/index.ts)
 */
export interface AuthAdapter {
  /** Human-readable name, shown in dev tooling / errors. */
  readonly name: string

  /**
   * Subscribe to auth state. MUST call `onUser` immediately with the
   * restored session (or null), then again on every change.
   * Returns an unsubscribe function.
   */
  onAuthStateChanged(onUser: (user: User | null) => void): () => void

  /** Launch the Google sign-in flow. Rejects with AuthError on failure. */
  signInWithGoogle(): Promise<User>

  /** End the session. */
  signOut(): Promise<void>
}

/** Normalized auth error codes the UI knows how to phrase kindly. */
export type AuthErrorCode =
  | 'popup-closed' // user closed the Google popup
  | 'network' // offline / request failed
  | 'cancelled' // flow superseded by another attempt
  | 'unknown'

export class AuthError extends Error {
  readonly code: AuthErrorCode
  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'AuthError'
    this.code = code
  }
}

/** Friendly copy for each failure mode — never blames the user. */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  'popup-closed': 'No worries — the sign-in window was closed. Try again whenever you like.',
  network: "We couldn't reach the sign-in service. Check your connection and try again.",
  cancelled: 'That sign-in attempt was interrupted. One more try should do it.',
  unknown: 'Something unexpected happened while signing in. Please try again.',
}
