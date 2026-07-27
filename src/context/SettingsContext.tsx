/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { isCloudMode } from '../auth'
import { fetchSettings, saveSettings } from '../lib/db'
import { useSafeLocalStorage } from '../hooks/useSafeLocalStorage'

/**
 * SettingsContext — user preferences: theme, sound, notifications,
 * auto-start, daily goal and pomodoro durations (minutes).
 *
 * Persistence is offline-first:
 *   - localStorage is always the immediate store (works in mock mode
 *     and keeps the UI instant)
 *   - in cloud mode the Supabase `user_settings` row is loaded after
 *     login (cloud wins over the device copy) and every change is
 *     saved back; failed saves set a dirty flag that is retried on
 *     the next login or 'online' event
 *
 * Stored values are merged over the defaults so adding new settings
 * never breaks existing users; corrupted data is discarded by
 * useSafeLocalStorage.
 */

export interface Settings {
  theme: 'light' | 'dark'
  soundOn: boolean
  /** Browser notifications on timer completion (permission asked on enable). */
  notificationsOn: boolean
  /** Automatically start the next pomodoro phase after a completion. */
  autoStartNext: boolean
  /** Daily focus goal in minutes (Garden tab progress). */
  dailyGoalMin: number
  focusMin: number
  shortBreakMin: number
  longBreakMin: number
  /** Focus sessions before a long break. */
  sessionsBeforeLongBreak: number
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  soundOn: true,
  notificationsOn: false,
  autoStartNext: false,
  dailyGoalMin: 120,
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  sessionsBeforeLongBreak: 4,
}

interface SettingsContextValue {
  settings: Settings
  update: (patch: Partial<Settings>) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

const isPartial = (v: unknown): v is Partial<Settings> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const cloud = isCloudMode && !!user

  const [stored, setStored] = useSafeLocalStorage<Partial<Settings>>(
    'focus-grove:settings',
    {},
    isPartial,
  )
  // true while a change hasn't reached Supabase yet (save failed offline)
  const [dirty, setDirty] = useSafeLocalStorage<boolean>(
    'focus-grove:settings-dirty',
    false,
    (v): v is boolean => typeof v === 'boolean',
  )

  // merge over defaults so newly added settings get sensible values
  const settings: Settings = { ...DEFAULT_SETTINGS, ...stored }

  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  // reflect the theme on <html> so plain CSS tokens can react to it
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  // cloud mode: after login, load the saved settings row. If the device
  // has unsynced changes (dirty) push those instead of overwriting them.
  useEffect(() => {
    if (!cloud || !user) return
    let cancelled = false
    const reconcile = async () => {
      try {
        if (dirtyRef.current) {
          await saveSettings(user.id, settingsRef.current)
          setDirty(false)
          return
        }
        const remote = await fetchSettings(user.id)
        if (remote && !cancelled) setStored((s) => ({ ...s, ...remote }))
      } catch {
        /* offline — keep the local copy, retry on 'online' below */
      }
    }
    void reconcile()
    const onOnline = () => void reconcile()
    window.addEventListener('online', onOnline)
    return () => {
      cancelled = true
      window.removeEventListener('online', onOnline)
    }
  }, [cloud, user, setStored, setDirty])

  const update = (patch: Partial<Settings>) => {
    setStored((s) => ({ ...s, ...patch }))
    if (!cloud || !user) return
    // save the merged result to Supabase; flag for retry when offline
    const next = { ...settingsRef.current, ...patch }
    saveSettings(user.id, next)
      .then(() => setDirty(false))
      .catch(() => setDirty(true))
  }

  return (
    <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
