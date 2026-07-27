/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { isCloudMode } from '../auth'
import { ensureProfile, fetchSessions, uploadSessions } from '../lib/db'
import { useSafeLocalStorage, userKey } from '../hooks/useSafeLocalStorage'
import type { FocusSession } from '../types'

/**
 * SessionsContext — the user's completed focus sessions, offline-first:
 *
 *   localStorage is ALWAYS written first (the UI never waits on the
 *   network), then Supabase when cloud mode is active.
 *
 * Sync strategy:
 *   - on login / reload: push any queued offline sessions, pull the
 *     cloud history, merge by id, cache the merge locally
 *   - on completion: save locally, then insert to Supabase; if that
 *     fails the id joins a pending queue
 *   - on the browser 'online' event: retry the pending queue
 *
 * `syncState` lets the UI show friendly copy like "Saved locally —
 * will sync when you're back online."
 */

export type SyncState =
  | 'local' // mock mode / no Supabase — everything stays on-device
  | 'syncing' // talking to Supabase right now
  | 'synced' // cloud and device agree
  | 'offline' // last write stayed local; will retry when back online

interface SessionsContextValue {
  sessions: FocusSession[]
  addSession: (data: { durationMin: number; task: string; source: FocusSession['source'] }) => void
  syncState: SyncState
  /** Number of sessions waiting to reach the cloud. */
  pendingCount: number
}

const SessionsContext = createContext<SessionsContextValue | null>(null)

function isSessionArray(v: unknown): v is FocusSession[] {
  return (
    Array.isArray(v) &&
    v.every(
      (s) =>
        !!s &&
        typeof s === 'object' &&
        typeof s.completedAt === 'number' &&
        typeof s.durationMin === 'number',
    )
  )
}

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string')

/** One-time migration of the pre-multi-user shared key. */
function migrateLegacy(uid: string) {
  try {
    const legacy = localStorage.getItem('focus-grove:sessions')
    if (!legacy) return
    const target = userKey(uid, 'sessions')
    if (!localStorage.getItem(target)) localStorage.setItem(target, legacy)
    localStorage.removeItem('focus-grove:sessions')
  } catch {
    /* ignore */
  }
}

/** Merge cloud + local session lists, de-duped by id, oldest first. */
function mergeSessions(cloud: FocusSession[], local: FocusSession[]): FocusSession[] {
  const byId = new Map<string, FocusSession>()
  for (const s of [...cloud, ...local]) byId.set(s.id ?? `${s.completedAt}`, s)
  return [...byId.values()].sort((a, b) => a.completedAt - b.completedAt)
}

export function SessionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.id ?? 'anonymous'
  migrateLegacy(uid)

  const cloud = isCloudMode && !!user

  const [sessions, setSessions] = useSafeLocalStorage<FocusSession[]>(
    userKey(uid, 'sessions'),
    [],
    isSessionArray,
  )
  // ids of sessions that haven't reached Supabase yet
  const [pendingIds, setPendingIds] = useSafeLocalStorage<string[]>(
    userKey(uid, 'pending-sessions'),
    [],
    isStringArray,
  )
  const [syncState, setSyncState] = useState<SyncState>(cloud ? 'syncing' : 'local')

  // refs keep the sync callback stable without stale closures
  const sessionsRef = useRef(sessions)
  sessionsRef.current = sessions
  const pendingRef = useRef(pendingIds)
  pendingRef.current = pendingIds

  /** Full sync: push the pending queue, pull cloud history, merge. */
  const syncAll = useCallback(async () => {
    if (!cloud || !user) return
    setSyncState('syncing')
    try {
      // profile safety net (normally created by the DB trigger)
      await ensureProfile(user).catch(() => {})
      // 1) push anything recorded while offline
      const local = sessionsRef.current
      const pending = local.filter((s) => pendingRef.current.includes(s.id))
      await uploadSessions(user.id, pending)
      setPendingIds([])
      // 2) pull the cloud history and reconcile with local
      const remote = await fetchSessions(user.id)
      setSessions(mergeSessions(remote, local))
      setSyncState('synced')
    } catch {
      // network down or DB unreachable — keep working from localStorage
      setSyncState('offline')
    }
  }, [cloud, user, setPendingIds, setSessions])

  // initial sync on login / reload, then retry whenever we come back online
  useEffect(() => {
    if (!cloud) {
      setSyncState('local')
      return
    }
    void syncAll()
    const onOnline = () => void syncAll()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [cloud, syncAll])

  /** Record a finished session — locally first, then to the cloud. */
  const addSession = useCallback(
    (data: { durationMin: number; task: string; source: FocusSession['source'] }) => {
      const session: FocusSession = {
        id: crypto.randomUUID(), // uuid so it can be the Supabase primary key
        completedAt: Date.now(),
        ...data,
      }
      setSessions((prev) => [...prev, session])
      if (!cloud || !user) return
      uploadSessions(user.id, [session])
        .then(() => setSyncState('synced'))
        .catch(() => {
          // queue it — the 'online' listener / next login will retry
          setPendingIds((prev) => [...prev, session.id])
          setSyncState('offline')
        })
    },
    [cloud, user, setSessions, setPendingIds],
  )

  return (
    <SessionsContext.Provider
      value={{ sessions, addSession, syncState, pendingCount: pendingIds.length }}
    >
      {children}
    </SessionsContext.Provider>
  )
}

export function useSessions() {
  const ctx = useContext(SessionsContext)
  if (!ctx) throw new Error('useSessions must be used inside <SessionsProvider>')
  return ctx
}
