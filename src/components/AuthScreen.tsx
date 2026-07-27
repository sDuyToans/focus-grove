import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isCloudMode } from '../auth'
import { supabaseConfigError } from '../lib/supabase'
import { AnimalCompanion } from './AnimalCompanion'
import { AmbientBackground } from './AmbientBackground'
import '../styles/auth.css'

/**
 * AuthScreen — the friendly welcome gate. Shows the companion, a short
 * pitch and a Google sign-in button. In cloud mode the button runs the
 * real Supabase OAuth redirect; otherwise the zero-credential mock.
 */

/** Multi-color Google "G" mark. */
function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export function AuthScreen() {
  const { signIn, isSigningIn, error, clearError } = useAuth()

  return (
    <div className="auth">
      <AmbientBackground />
      <motion.div
        className="auth-card card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <AnimalCompanion mood="idle" size={170} />
        <h1 className="auth-title">Focus Grove</h1>
        <p className="auth-tagline">
          A calm little corner for deep work. Brew some tea, pick a timer,
          and let Maple the cat keep you company.
        </p>

        <button
          className="btn btn-lg auth-google"
          onClick={() => void signIn()}
          disabled={isSigningIn}
        >
          {isSigningIn ? (
            <>
              <Loader2 className="auth-spinner" size={20} aria-hidden="true" />
              Opening Google…
            </>
          ) : (
            <>
              <GoogleG />
              Continue with Google
            </>
          )}
        </button>

        {/* startup configuration problem (e.g. only one Supabase var set) */}
        {supabaseConfigError && (
          <div className="auth-error" role="alert">
            <span>{supabaseConfigError}</span>
          </div>
        )}

        {/* friendly sign-in failure (popup closed, offline, …) */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="auth-error"
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span>{error}</span>
              <button className="auth-error-dismiss" onClick={clearError} aria-label="Dismiss error">
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="auth-footnote">
          {isCloudMode ? (
            <>Signed sessions sync to your account — your data stays yours.</>
          ) : (
            <>
              Running in friendly demo mode — connect Supabase via <code>.env.local</code> when
              you're ready.
            </>
          )}
        </p>
      </motion.div>
    </div>
  )
}
