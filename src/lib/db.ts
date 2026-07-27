import { supabase } from './supabase'
import type { Settings } from '../context/SettingsContext'
import type { FocusSession, User } from '../types'

/**
 * db.ts — typed reads/writes for the Supabase tables (see
 * supabase/schema.sql). Everything here:
 *
 *   - no-ops or throws cleanly when Supabase isn't configured
 *   - maps DB snake_case rows ↔ the app's camelCase types
 *   - relies on Row Level Security for protection (the anon key can
 *     only touch the signed-in user's own rows)
 *
 * Callers (useSessions, SettingsContext) treat any thrown error as
 * "we're offline / the request failed" and fall back to localStorage.
 */

// ── session type mapping ─────────────────────────────────────────────
// app 'pomodoro' → 'pomodoro_focus', app 'timer' → 'custom_timer'
// ('pomodoro_break' is reserved in the schema; the app currently only
// records completed *focus* blocks)

const toDbType: Record<FocusSession['source'], string> = {
  pomodoro: 'pomodoro_focus',
  timer: 'custom_timer',
}

function fromDbType(t: string): FocusSession['source'] {
  return t === 'custom_timer' ? 'timer' : 'pomodoro'
}

interface SessionRow {
  id: string
  session_type: string
  duration_minutes: number
  task: string | null
  completed_at: string
}

// ── focus_sessions ───────────────────────────────────────────────────

/** All of the user's sessions, oldest first (matches local ordering). */
export async function fetchSessions(userId: string): Promise<FocusSession[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('id, session_type, duration_minutes, task, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as SessionRow[]).map((r) => ({
    id: r.id,
    completedAt: new Date(r.completed_at).getTime(),
    durationMin: r.duration_minutes,
    task: r.task ?? '',
    source: fromDbType(r.session_type),
  }))
}

/**
 * Upload sessions (used for both single completions and the offline
 * queue). `ignoreDuplicates` makes retries idempotent: a session that
 * already made it up is silently skipped.
 */
export async function uploadSessions(userId: string, sessions: FocusSession[]): Promise<void> {
  if (!supabase || sessions.length === 0) return
  const rows = sessions.map((s) => ({
    id: s.id,
    user_id: userId,
    session_type: toDbType[s.source],
    duration_minutes: Math.max(1, Math.round(s.durationMin)),
    task: s.task,
    completed_at: new Date(s.completedAt).toISOString(),
  }))
  const { error } = await supabase
    .from('focus_sessions')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
}

// ── user_settings ────────────────────────────────────────────────────

interface SettingsRow {
  focus_minutes: number
  short_break_minutes: number
  long_break_minutes: number
  sessions_before_long_break: number
  sound_enabled: boolean
  notifications_enabled: boolean
  auto_start_breaks: boolean
  auto_start_focus: boolean
  daily_goal_minutes: number
  theme: string
}

/** The user's saved settings, or null when no row exists yet. */
export async function fetchSettings(userId: string): Promise<Partial<Settings> | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const r = data as unknown as SettingsRow
  return {
    focusMin: r.focus_minutes,
    shortBreakMin: r.short_break_minutes,
    longBreakMin: r.long_break_minutes,
    sessionsBeforeLongBreak: r.sessions_before_long_break,
    soundOn: r.sound_enabled,
    notificationsOn: r.notifications_enabled,
    // the app has one auto-start switch; the schema keeps two for
    // future flexibility — either one being on maps to "on"
    autoStartNext: r.auto_start_breaks || r.auto_start_focus,
    dailyGoalMin: r.daily_goal_minutes,
    theme: r.theme === 'dark' ? 'dark' : 'light',
  }
}

/** Save the full settings object (upsert, so it also heals a missing row). */
export async function saveSettings(userId: string, s: Settings): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: userId,
      focus_minutes: s.focusMin,
      short_break_minutes: s.shortBreakMin,
      long_break_minutes: s.longBreakMin,
      sessions_before_long_break: s.sessionsBeforeLongBreak,
      sound_enabled: s.soundOn,
      notifications_enabled: s.notificationsOn,
      auto_start_breaks: s.autoStartNext,
      auto_start_focus: s.autoStartNext,
      daily_goal_minutes: s.dailyGoalMin,
      theme: s.theme,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw new Error(error.message)
}

// ── profiles ─────────────────────────────────────────────────────────

/**
 * Frontend safety net for profile creation. The database trigger in
 * schema.sql normally creates the profile + default settings on first
 * login; this covers projects where the trigger wasn't installed.
 * `ignoreDuplicates` means existing rows are never overwritten.
 */
export async function ensureProfile(user: User): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('profiles').upsert(
    { id: user.id, display_name: user.name, avatar_url: user.avatarUrl },
    { onConflict: 'id', ignoreDuplicates: true },
  )
  if (error) throw new Error(error.message)
}
