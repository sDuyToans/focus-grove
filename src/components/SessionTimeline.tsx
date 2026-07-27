import { motion, useReducedMotion } from 'framer-motion'
import type { PomodoroPhase } from '../types'
import '../styles/views.css'

/**
 * SessionTimeline — the pomodoro cycle as a row of illustrated markers:
 * each focus session is a little plant that grows from seed → sprout,
 * with a coffee-cup marker for the long break at the end. Replaces the
 * plain dots with something that feels like a garden bed.
 */

interface Props {
  /** Focus sessions completed in the current cycle. */
  done: number
  /** Focus sessions per cycle (before the long break). */
  perCycle: number
  phase: PomodoroPhase
  isRunning: boolean
}

/** A tiny hand-drawn plant: seed (grown=false) or sprout (grown=true). */
function Plant({ grown, growing }: { grown: boolean; growing: boolean }) {
  const reduced = useReducedMotion()
  return (
    <motion.svg
      viewBox="0 0 28 32"
      className="timeline-plant"
      initial={false}
      animate={grown && !reduced ? { scale: [0.7, 1.15, 1] } : undefined}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* soil mound */}
      <path d="M4 27 Q14 22 24 27 L24 30 L4 30 Z" className="timeline-soil" />
      {grown ? (
        <g className="timeline-sprout">
          <path d="M14 26 L14 14" />
          <path d="M14 18 Q7 17 6 10 Q13 10 14 17" className="timeline-leaf" />
          <path d="M14 15 Q21 14 22 7 Q15 7 14 14" className="timeline-leaf" />
        </g>
      ) : (
        <>
          <ellipse cx="14" cy="25" rx="3.4" ry="4" className="timeline-seed" />
          {growing && !reduced && (
            /* the seed currently being grown pulses gently */
            <motion.circle
              cx="14"
              cy="25"
              r="7"
              className="timeline-pulse"
              animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </>
      )}
    </motion.svg>
  )
}

export function SessionTimeline({ done, perCycle, phase, isRunning }: Props) {
  return (
    <div
      className="timeline"
      role="img"
      aria-label={`${done} of ${perCycle} focus sessions this cycle, then a long break`}
    >
      {Array.from({ length: perCycle }, (_, i) => (
        <Plant key={i} grown={i < done} growing={i === done && phase === 'focus' && isRunning} />
      ))}
      {/* the long break at the end of the row */}
      <svg viewBox="0 0 28 32" className={`timeline-plant ${phase === 'longBreak' ? 'timeline-break-active' : ''}`}>
        <g className="timeline-cup">
          <path d="M7 16 L21 16 L19.5 27 Q14 29 8.5 27 Z" />
          <path d="M21 18 Q26 18 24.5 22 Q23.5 24 20 24" fill="none" />
          <path d="M11 12 Q12 9.5 11 8 M16 12 Q17 9.5 16 8" fill="none" className="timeline-steam" />
        </g>
      </svg>
    </div>
  )
}
