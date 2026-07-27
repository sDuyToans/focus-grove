import { Flower2, Hourglass } from 'lucide-react'
import type { FocusStats } from '../types'
import { EmptyState } from './EmptyState'
import '../styles/views.css'

/**
 * SessionHistory — completed sessions grouped by day (Today, Yesterday,
 * then dates), each entry showing time, duration, source and the task
 * it was attached to. Friendly empty state before the first session.
 */

interface Props {
  stats: FocusStats
  /** Cap the number of day groups shown (e.g. sidebar usage). */
  maxDays?: number
}

export function SessionHistory({ stats, maxDays }: Props) {
  const groups = maxDays ? stats.byDay.slice(0, maxDays) : stats.byDay

  return (
    <div className="history card">
      <h3 className="history-title">Session history</h3>

      {groups.length === 0 ? (
        <EmptyState emoji="🌱" title="Nothing planted yet">
          Finish a focus session or a timer and it will appear here, one sprout at a time.
        </EmptyState>
      ) : (
        <div className="history-groups">
          {groups.map((g) => (
            <div className="history-group" key={g.label}>
              <p className="history-day">{g.label}</p>
              <ul className="history-list">
                {g.sessions.map((s) => (
                  <li className="history-item" key={s.id ?? s.completedAt}>
                    {s.source === 'timer' ? (
                      <Hourglass size={16} className="history-icon" aria-hidden="true" />
                    ) : (
                      <Flower2 size={16} className="history-icon" aria-hidden="true" />
                    )}
                    <span className="history-task">{s.task || 'Mindful session'}</span>
                    <span className="history-meta">
                      {s.durationMin}m ·{' '}
                      {new Date(s.completedAt).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
