import { Flame, Leaf, Sprout, Timer } from 'lucide-react'
import type { FocusStats } from '../types'
import '../styles/views.css'

/**
 * DailySummary — four cozy stat tiles: today's minutes & sessions, the
 * current streak, and all-time sessions. Small and friendly, not a
 * dashboard.
 */

export function DailySummary({ stats }: { stats: FocusStats }) {
  const tiles = [
    { Icon: Timer, value: `${stats.todayMinutes}m`, label: 'focused today', color: 'var(--sage)' },
    { Icon: Sprout, value: `${stats.todaySessions}`, label: 'sessions today', color: 'var(--terracotta)' },
    { Icon: Flame, value: `${stats.streakDays}`, label: stats.streakDays === 1 ? 'day streak' : 'day streak', color: 'var(--yellow)' },
    { Icon: Leaf, value: `${stats.totalSessions}`, label: 'all-time sessions', color: 'var(--blue)' },
  ]

  return (
    <div className="summary">
      {tiles.map(({ Icon, value, label, color }) => (
        <div className="summary-tile card" key={label}>
          <Icon size={22} style={{ color }} aria-hidden="true" />
          <span className="summary-value">{value}</span>
          <span className="summary-label">{label}</span>
        </div>
      ))}
    </div>
  )
}
