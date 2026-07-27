import { motion, useReducedMotion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import '../styles/views.css'

/**
 * FocusGoal — the daily focus goal with a hand-drawn progress bar and
 * gentle steppers to adjust the target. Celebratory copy when reached.
 */

export function FocusGoal({ todayMinutes }: { todayMinutes: number }) {
  const { settings, update } = useSettings()
  const reduced = useReducedMotion()
  const goal = settings.dailyGoalMin
  const pct = Math.min(1, todayMinutes / goal)
  const reached = pct >= 1

  return (
    <div className="goal card">
      <div className="goal-head">
        <h3 className="settings-title">Daily goal</h3>
        <div className="settings-stepper">
          <button
            className="btn btn-icon settings-step"
            onClick={() => update({ dailyGoalMin: Math.max(15, goal - 15) })}
            disabled={goal <= 15}
            aria-label="Decrease daily goal"
          >
            <Minus size={16} />
          </button>
          <span className="settings-value">{goal}m</span>
          <button
            className="btn btn-icon settings-step"
            onClick={() => update({ dailyGoalMin: Math.min(600, goal + 15) })}
            disabled={goal >= 600}
            aria-label="Increase daily goal"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div
        className="goal-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(todayMinutes, goal)}
        aria-label="Daily focus goal progress"
      >
        <motion.div
          className={`goal-fill ${reached ? 'goal-fill-done' : ''}`}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <p className="goal-copy">
        {reached
          ? `Goal reached — ${todayMinutes} lovely minutes! 🎉`
          : todayMinutes > 0
            ? `${todayMinutes} of ${goal} minutes — steadily growing. 🌱`
            : `Plant your first minutes toward ${goal} today.`}
      </p>
    </div>
  )
}
