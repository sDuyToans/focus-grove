import { useSessions } from '../hooks/useSessions'
import { useFocusStats } from '../hooks/useFocusStats'
import { DailySummary } from './DailySummary'
import { WeeklyActivity } from './WeeklyActivity'
import { FocusGoal } from './FocusGoal'
import { SessionHistory } from './SessionHistory'
import { SyncStatus } from './SyncStatus'
import { EmptyState } from './EmptyState'
import '../styles/views.css'

/**
 * GardenView — the cozy stats tab: today's summary tiles, daily goal
 * progress, a 7-day activity strip and the full session history. Kept
 * intentionally small and garden-themed — this is a journal page, not
 * a dashboard.
 */

export function GardenView() {
  const { sessions } = useSessions()
  const stats = useFocusStats(sessions)

  if (sessions.length === 0) {
    return (
      <section className="view garden-view" aria-label="Your garden">
        <div className="card garden-empty-card">
          <EmptyState emoji="🪴" title="Your garden is waiting">
            Every focus session you complete plants something here — minutes, streaks and a little
            weekly meadow. Start a pomodoro or a timer to grow your first sprout.
          </EmptyState>
        </div>
      </section>
    )
  }

  return (
    <section className="view garden-view" aria-label="Your garden">
      <DailySummary stats={stats} />
      <div className="garden-grid">
        <div className="garden-col">
          <FocusGoal todayMinutes={stats.todayMinutes} />
          <WeeklyActivity stats={stats} />
        </div>
        <div className="garden-col">
          <SessionHistory stats={stats} maxDays={7} />
        </div>
      </div>
      <SyncStatus />
    </section>
  )
}
