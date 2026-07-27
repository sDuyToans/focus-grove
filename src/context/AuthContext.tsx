/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { AUTH_ERROR_MESSAGES, AuthError, authAdapter } from '../auth'
import type { User } from '../types'

/**
 * AuthContext — thin React layer over the pluggable AuthAdapter
 * (src/auth). The adapter handles the actual backend (mock by default,
 * Firebase/Supabase when configured via VITE_AUTH_PROVIDER); this
 * context tracks the session plus the UI states around it:
 *
 *   isInitializing — restoring a persisted session on first load
 *   isSigningIn    — the Google popup round-trip is in flight
 *   error          — a friendly message when sign-in fails
 *                    (popup closed, offline, …) — see AUTH_ERROR_MESSAGES
 */

interface AuthContextValue {
  user: User | null
  isInitializing: boolean
  isSigningIn: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // subscribe once; the adapter replays the restored session immediately
  useEffect(() => {
    const unsubscribe = authAdapter.onAuthStateChanged((u) => {
      setUser(u)
      setIsInitializing(false)
    })
    return unsubscribe
  }, [])

  const signIn = useCallback(async () => {
    setError(null)
    setIsSigningIn(true)
    try {
      await authAdapter.signInWithGoogle()
    } catch (e) {
      const code = e instanceof AuthError ? e.code : 'unknown'
      setError(e instanceof AuthError && e.code === 'unknown' && e.message !== 'unknown'
        ? e.message
        : AUTH_ERROR_MESSAGES[code])
    } finally {
      setIsSigningIn(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await authAdapter.signOut()
    } catch {
      /* even if the backend call fails, clear the local session */
      setUser(null)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider
      value={{ user, isInitializing, isSigningIn, error, signIn, signOut, clearError }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
