import { AuthError, type AuthAdapter } from './types'

/**
 * firebaseAdapter — connect real Google sign-in via Firebase.
 *
 * ── HOW TO ENABLE ────────────────────────────────────────────────────
 * 1. `npm install firebase`
 * 2. Create a Firebase project → enable Google as a sign-in provider.
 * 3. Copy your web-app config into .env.local (see .env.example):
 *      VITE_AUTH_PROVIDER=firebase
 *      VITE_FIREBASE_API_KEY=…
 *      VITE_FIREBASE_AUTH_DOMAIN=…
 *      VITE_FIREBASE_PROJECT_ID=…
 *      VITE_FIREBASE_APP_ID=…
 * 4. Replace the stub below with the commented implementation.
 * ─────────────────────────────────────────────────────────────────────
 *
 * Reference implementation (uncomment after installing `firebase`):
 *
 * import { initializeApp } from 'firebase/app'
 * import {
 *   getAuth, GoogleAuthProvider, signInWithPopup,
 *   onAuthStateChanged, signOut,
 * } from 'firebase/auth'
 *
 * const app = initializeApp({
 *   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
 *   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
 *   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
 *   appId: import.meta.env.VITE_FIREBASE_APP_ID,
 * })
 * const auth = getAuth(app)
 *
 * export const firebaseAdapter: AuthAdapter = {
 *   name: 'firebase',
 *   onAuthStateChanged: (onUser) =>
 *     onAuthStateChanged(auth, (u) =>
 *       onUser(u && {
 *         id: u.uid,
 *         name: u.displayName ?? 'Friend',
 *         email: u.email ?? '',
 *         avatarUrl: u.photoURL ?? '',
 *       }),
 *     ),
 *   async signInWithGoogle() {
 *     try {
 *       const res = await signInWithPopup(auth, new GoogleAuthProvider())
 *       const u = res.user
 *       return { id: u.uid, name: u.displayName ?? 'Friend', email: u.email ?? '', avatarUrl: u.photoURL ?? '' }
 *     } catch (e: unknown) {
 *       const code = (e as { code?: string }).code
 *       if (code === 'auth/popup-closed-by-user') throw new AuthError('popup-closed')
 *       if (code === 'auth/cancelled-popup-request') throw new AuthError('cancelled')
 *       if (code === 'auth/network-request-failed') throw new AuthError('network')
 *       throw new AuthError('unknown', String(e))
 *     }
 *   },
 *   signOut: () => signOut(auth),
 * }
 */

export const firebaseAdapter: AuthAdapter = {
  name: 'firebase',
  onAuthStateChanged(onUser) {
    onUser(null)
    return () => {}
  },
  signInWithGoogle() {
    return Promise.reject(
      new AuthError(
        'unknown',
        'Firebase is not configured yet — see src/auth/firebaseAdapter.ts for setup steps, ' +
          'or set VITE_AUTH_PROVIDER=mock for development.',
      ),
    )
  },
  signOut: () => Promise.resolve(),
}
