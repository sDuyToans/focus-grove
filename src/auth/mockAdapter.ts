import type { User } from '../types'
import type { AuthAdapter } from './types'

/**
 * mockAdapter — the zero-credential development backend.
 *
 * Simulates the Google OAuth round-trip (short delay → sample user) and
 * persists the session in localStorage so refreshes stay signed in,
 * mirroring how Firebase/Supabase restore sessions.
 */

const SESSION_KEY = 'focus-grove:mock-session'

/** A friendly hand-drawn placeholder avatar (inline SVG data URI). */
const AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="%23f0d5c8"/><circle cx="32" cy="26" r="11" fill="%238a6f52"/><path d="M12 56 Q32 38 52 56 L52 64 L12 64 Z" fill="%237d9b76"/><circle cx="27.5" cy="24" r="1.6" fill="%23fffaf0"/><circle cx="36.5" cy="24" r="1.6" fill="%23fffaf0"/><path d="M28 30 Q32 33 36 30" stroke="%23fffaf0" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`

const MOCK_USER: User = {
  id: 'mock-google-user-1',
  name: 'Sunny Nguyen',
  email: 'sunny.nguyen@gmail.com',
  avatarUrl: `data:image/svg+xml;utf8,${AVATAR_SVG}`,
}

function readSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const u = JSON.parse(raw) as User
    // minimal shape validation — treat anything malformed as signed out
    if (typeof u?.id === 'string' && typeof u?.name === 'string') return u
  } catch {
    /* corrupted — fall through */
  }
  localStorage.removeItem(SESSION_KEY)
  return null
}

const listeners = new Set<(user: User | null) => void>()

function emit(user: User | null) {
  listeners.forEach((l) => l(user))
}

export const mockAdapter: AuthAdapter = {
  name: 'mock',

  onAuthStateChanged(onUser) {
    listeners.add(onUser)
    onUser(readSession()) // immediate restore, like real providers
    return () => {
      listeners.delete(onUser)
    }
  },

  async signInWithGoogle() {
    // simulated popup round-trip
    await new Promise((r) => setTimeout(r, 1100))
    localStorage.setItem(SESSION_KEY, JSON.stringify(MOCK_USER))
    emit(MOCK_USER)
    return MOCK_USER
  },

  async signOut() {
    localStorage.removeItem(SESSION_KEY)
    emit(null)
  },
}
