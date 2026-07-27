import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play, RotateCcw, RefreshCw } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { formatMs, useCountdown } from '../hooks/useCountdown'
import { useChime } from '../hooks/useChime'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useNotifications } from '../hooks/useNotifications'
import { useSafeLocalStorage, userKey } from '../hooks/useSafeLocalStorage'
import { useFocusTask, useSessions } from '../hooks/useSessions'
import { AnimalCompanion } from './AnimalCompanion'
import { CompanionStatus } from './CompanionStatus'
import { CompletionCelebration } from './CompletionCelebration'
import { CountdownDisplay } from './CountdownDisplay'
import { FocusTaskInput } from './FocusTaskInput'
import { ProgressRing } from './ProgressRing'
import '../styles/views.css'

/**
 * TimerView — a free-form countdown. Pick a preset or type minutes and
 * seconds, then start. Completions are recorded to the user's history
 * as `source: 'timer'` (tracked separately from pomodoro sessions) and
 * tagged with the current focus task. "Go again" repeats the same
 * duration; "Done" closes the celebration.
 *
 * The timer persists per user (reload-safe), mirrors the countdown in
 * the tab title and supports Space (start/pause) + R (reset).
 */

const PRESETS = [5, 10, 15, 30, 60]

export function TimerView() {
  const { user } = useAuth()
  const uid = user?.id ?? 'anonymous'
  const { settings } = useSettings()
  const [task] = useFocusTask()
  const { addSession } = useSessions()
  const chime = useChime(settings.soundOn)
  const { notify } = useNotifications(settings.notificationsOn)

  // last used duration persists so the tab reopens how you left it
  const [savedMin, setSavedMin] = useSafeLocalStorage(
    userKey(uid, 'timer-min'),
    10,
    (v): v is number => typeof v === 'number' && v > 0,
  )
  const [minutes, setMinutes] = useState(savedMin)
  const [seconds, setSeconds] = useState(0)
  const [finished, setFinished] = useState(false)

  const countdown = useCountdown(savedMin * 60_000, {
    persistKey: userKey(uid, 'custom-timer'),
    onComplete: () => {
      chime()
      notify('Timer finished ⏳', 'Your countdown is done — nicely held.')
      addSession({
        durationMin: Math.max(1, Math.round(countdown.totalMs / 60_000)),
        task,
        source: 'timer',
      })
      setFinished(true)
    },
  })
  const { remainingMs, totalMs, isRunning, start, pause, reset } = countdown

  const configuredMs = Math.max(1, minutes * 60 + seconds) * 1000
  const idleAtFull = !isRunning && remainingMs === totalMs && !finished

  const applyAndStart = useCallback(() => {
    setFinished(false)
    setSavedMin(minutes)
    reset(configuredMs)
    // reset() stops the clock, so start on the next tick with fresh state
    requestAnimationFrame(() => start())
  }, [minutes, configuredMs, reset, start, setSavedMin])

  const pickPreset = (min: number) => {
    setMinutes(min)
    setSeconds(0)
    setFinished(false)
    reset(min * 60_000)
    setSavedMin(min)
  }

  const clampNum = (v: string, max: number) => {
    const n = Number.parseInt(v, 10)
    return Number.isNaN(n) ? 0 : Math.min(max, Math.max(0, n))
  }

  const doReset = useCallback(() => {
    setFinished(false)
    reset(configuredMs)
  }, [reset, configuredMs])

  const toggleRun = useCallback(() => {
    if (isRunning) pause()
    else if (idleAtFull) applyAndStart()
    else {
      setFinished(false)
      start()
    }
  }, [isRunning, idleAtFull, pause, applyAndStart, start])

  // Space start/pause · R reset (ignored while typing in the inputs)
  useKeyboardShortcuts({ ' ': toggleRun, r: doReset })

  useDocumentTitle(isRunning || remainingMs < totalMs ? `${formatMs(remainingMs)} · Timer` : null)

  return (
    <section className="view timer-view" aria-label="Custom timer">
      <FocusTaskInput active={isRunning} />

      <div className="timer-layout">
        <div className="pomo-center">
          <ProgressRing
            progress={totalMs > 0 ? remainingMs / totalMs : 0}
            color="var(--blue)"
            size={310}
          >
            <CountdownDisplay
              ms={remainingMs}
              label={finished ? 'time!' : isRunning ? 'ticking away…' : 'ready when you are'}
            />
          </ProgressRing>

          <div className="view-controls">
            {isRunning ? (
              <button className="btn btn-lg btn-warm" onClick={pause}>
                <Pause size={20} aria-hidden="true" /> Pause
              </button>
            ) : (
              <button className="btn btn-lg btn-primary" onClick={toggleRun}>
                <Play size={20} aria-hidden="true" />
                {remainingMs < totalMs && remainingMs > 0 ? 'Resume' : 'Start'}
              </button>
            )}
            <button className="btn" onClick={doReset}>
              <RotateCcw size={18} aria-hidden="true" /> Reset
            </button>
            <button className="btn" onClick={applyAndStart}>
              <RefreshCw size={18} aria-hidden="true" /> Restart
            </button>
          </div>

          <p className="shortcut-hint" aria-hidden="true">
            <kbd>Space</kbd> start/pause · <kbd>R</kbd> reset
          </p>
        </div>

        <aside className="timer-side">
          <div className="card timer-setup">
            <h3 className="settings-title">Set your timer</h3>

            <div className="timer-presets">
              {PRESETS.map((min) => (
                <button
                  key={min}
                  className={`btn timer-preset ${minutes === min && seconds === 0 ? 'timer-preset-active' : ''}`}
                  onClick={() => pickPreset(min)}
                  disabled={isRunning}
                >
                  {min}m
                </button>
              ))}
            </div>

            <div className="timer-custom">
              <label>
                <span>Minutes</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={599}
                  value={minutes}
                  disabled={isRunning}
                  onChange={(e) => setMinutes(clampNum(e.target.value, 599))}
                />
              </label>
              <span className="timer-colon">:</span>
              <label>
                <span>Seconds</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={59}
                  value={seconds}
                  disabled={isRunning}
                  onChange={(e) => setSeconds(clampNum(e.target.value, 59))}
                />
              </label>
            </div>
            {isRunning && <p className="settings-hint">Pause to change the duration ✋</p>}
          </div>

          <CompanionStatus
            mood={finished ? 'celebrate' : isRunning ? 'focus' : 'idle'}
            caption={
              finished
                ? 'Ding! Maple says you made it.'
                : isRunning
                  ? 'Maple is keeping time with you.'
                  : undefined
            }
          />
        </aside>
      </div>

      {/* gentle completion overlay */}
      <AnimatePresence>
        {finished && (
          <motion.div
            className="timer-done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="alert"
          >
            <CompletionCelebration />
            <motion.div
              className="card timer-done-card"
              initial={{ scale: 0.9, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <AnimalCompanion mood="celebrate" size={140} />
              <h2>Time's up! 🎉</h2>
              <p>
                {Math.round(totalMs / 60_000)} lovely minutes
                {task ? (
                  <>
                    {' '}on <strong>{task}</strong>
                  </>
                ) : null}
                .
              </p>
              <div className="view-controls">
                <button className="btn btn-primary" onClick={applyAndStart}>
                  <RefreshCw size={18} aria-hidden="true" /> Go again
                </button>
                <button className="btn" onClick={doReset}>
                  Done for now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
