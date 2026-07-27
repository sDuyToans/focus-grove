import { motion, useReducedMotion } from 'framer-motion'
import type { FocusStats } from '../types'
import '../styles/views.css'

/**
 * WeeklyActivity — the last 7 days as a row of hand-drawn "garden beds":
 * a soft bar grows with focus minutes and a leaf appears on active
 * days. Gentle alternative to a bar chart.
 */

export function WeeklyActivity({ stats }: { stats: FocusStats }) {
  const reduced = useReducedMotion()
  const max = Math.max(30, ...stats.week.map((d) => d.minutes))

  return (
    <div className="weekly card">
      <h3 className="settings-title">This week</h3>
      <div className="weekly-days">
        {stats.week.map((d, i) => {
          const h = Math.round((d.minutes / max) * 64)
          const isToday = i === stats.week.length - 1
          return (
            <div className="weekly-day" key={d.date.toISOString()}>
              <span className="weekly-minutes">{d.minutes > 0 ? `${d.minutes}m` : ''}</span>
              <div className="weekly-bar-track">
                <motion.div
                  className={`weekly-bar ${d.minutes > 0 ? 'weekly-bar-active' : ''}`}
                  initial={reduced ? false : { height: 0 }}
                  animate={{ height: Math.max(d.minutes > 0 ? 10 : 4, h) }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
                />
                {d.minutes > 0 && (
                  <svg viewBox="0 0 20 20" className="weekly-leaf" aria-hidden="true">
                    <path d="M10 2 Q17 7 10 17 Q3 7 10 2" />
                  </svg>
                )}
              </div>
              <span className={`weekly-label ${isToday ? 'weekly-label-today' : ''}`}>
                {isToday ? 'Today' : d.date.toLocaleDateString([], { weekday: 'narrow' })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
