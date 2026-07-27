/** Shared app types. */

export type TabId = 'clock' | 'pomodoro' | 'timer' | 'garden'

export type CompanionMood =
  | 'idle' // curious resting pose
  | 'focus' // determined, leaning in (holds a pencil)
  | 'sleep' // short break — napping with Zzz
  | 'stretch' // long break — relaxed stretch
  | 'celebrate' // session complete — happy jump
  | 'sad' // timer abandoned — gently wistful, never guilt-tripping

export interface User {
  id: string
  name: string
  email: string
  /** Data-URI or remote URL for the avatar image. */
  avatarUrl: string
}

export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak'

/** A completed focus block — from either the pomodoro or the free timer. */
export interface FocusSession {
  id: string
  /** Epoch ms when the session completed. */
  completedAt: number
  /** Length of the completed session in minutes. */
  durationMin: number
  /** What the user said they were focusing on (may be empty). */
  task: string
  /** Which tool produced it. */
  source: 'pomodoro' | 'timer'
}

/** Aggregate produced by useFocusStats. */
export interface FocusStats {
  todayMinutes: number
  todaySessions: number
  /** Consecutive days (ending today or yesterday) with ≥1 session. */
  streakDays: number
  totalSessions: number
  totalMinutes: number
  /** Last 7 days, oldest first. */
  week: { date: Date; minutes: number; sessions: number }[]
  /** Sessions grouped by day, newest day first. */
  byDay: { label: string; sessions: FocusSession[] }[]
}
