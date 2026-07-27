import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { formatMs, useCountdown } from '../hooks/useCountdown'
import { useChime } from '../hooks/useChime'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useFocusStats } from '../hooks/useFocusStats'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useNotifications } from '../hooks/useNotifications'
import { useSafeLocalStorage, userKey } from '../hooks/useSafeLocalStorage'
import { useFocusTask, useSessions } from '../hooks/useSessions'
import { CompanionStatus } from './CompanionStatus'
import { CompletionCelebration } from './CompletionCelebration'
import { CountdownDisplay } from './CountdownDisplay'
import { FocusTaskInput } from './FocusTaskInput'
import { NotificationSettings } from './NotificationSettings'
import { ProgressRing } from './ProgressRing'
import { SessionTimeline } from './SessionTimeline'
import { SettingsPanel } from './SettingsPanel'
import type { CompanionMood, PomodoroPhase } from '../types'
import '../styles/views.css'

/**
 * PomodoroView — classic focus/break cycles.
 *
 * Flow: focus → short break → focus → … → long break (after N focus
 * sessions). Completing a phase plays the chime, fires a browser
 * notification (if enabled), records finished focus sessions (tagged
 * with the current task) and shows a short celebration, then lines up
 * the next phase — auto-starting it when the preference is on.
 *
 * Extras handled here:
 *  - timer state persists per user, so a reload (or a locked iPad)
 *    picks up exactly where it left off — even completing "while away"
 *  - document title mirrors the countdown ("24:32 · Focus — Focus Grove")
 *  - keyboard shortcuts: Space start/pause, R reset, S skip
 *  - resetting mid-focus shows Maple's gently wistful pose (never guilt)
 */

const PHASE_META: Record<PomodoroPhase, { label: string; color: string; hint: string }> = {
  focus: { label: 'Focus', color: 'var(--sage)', hint: 'One gentle thing at a time.' },
  shortBreak: { label: 'Short Break', color: 'var(--blue)', hint: 'Stretch, sip, look far away.' },
  longBreak: { label: 'Long Break', color: 'var(--terracotta)', hint: 'You earned a proper rest.' },
}

/** Collapsible card section — always open on desktop (CSS), toggleable on small screens. */
function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`collapsible ${open ? 'collapsible-open' : ''}`}>
      <button className="collapsible-toggle btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {title}
        <ChevronDown size={18} className="collapsible-chevron" aria-hidden="true" />
      </button>
      <div className="collapsible-body">{children}</div>
    </div>
  )
}

function isPhase(v: unknown): v is PomodoroPhase {
  return v === 'focus' || v === 'shortBreak' || v === 'longBreak'
}

export function PomodoroView() {
  const { user } = useAuth()
  const uid = user?.id ?? 'anonymous'
  const { settings } = useSettings()
  const [task] = useFocusTask()
  const { sessions, addSession } = useSessions()
  const stats = useFocusStats(sessions)
  const chime = useChime(settings.soundOn)
  const { notify } = useNotifications(settings.notificationsOn)

  // phase + cycle position persist so reloads keep the rhythm
  const [phase, setPhase] = useSafeLocalStorage<PomodoroPhase>(
    userKey(uid, 'pomodoro-phase'),
    'focus',
    isPhase,
  )
  const [doneInCycle, setDoneInCycle] = useSafeLocalStorage<number>(
    userKey(uid, 'pomodoro-cycle'),
    0,
    (v): v is number => typeof v === 'number' && v >= 0,
  )
  const [celebrating, setCelebrating] = useState(false)
  const [abandoned, setAbandoned] = useState(false)

  const phaseMinutes = useCallback(
    (p: PomodoroPhase) =>
      p === 'focus'
        ? settings.focusMin
        : p === 'shortBreak'
          ? settings.shortBreakMin
          : settings.longBreakMin,
    [settings.focusMin, settings.shortBreakMin, settings.longBreakMin],
  )

  // refs so callbacks always see current values without re-subscribing
  const stateRef = useRef({ phase, doneInCycle, task })
  stateRef.current = { phase, doneInCycle, task }
  const autoStartRef = useRef(false)

  const advance = useCallback(
    (completed: boolean) => {
      const { phase: p, doneInCycle: done, task: currentTask } = stateRef.current
      let next: PomodoroPhase
      let nextDone = done
      if (p === 'focus') {
        nextDone = done + 1
        next = nextDone >= settings.sessionsBeforeLongBreak ? 'longBreak' : 'shortBreak'
        if (completed) {
          addSession({ durationMin: settings.focusMin, task: currentTask, source: 'pomodoro' })
        }
      } else {
        next = 'focus'
        if (p === 'longBreak') nextDone = 0
      }
      setDoneInCycle(nextDone)
      setPhase(next)
      countdown.reset(phaseMinutes(next) * 60_000)
      if (completed && settings.autoStartNext) autoStartRef.current = true
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.sessionsBeforeLongBreak, settings.focusMin, settings.autoStartNext, phaseMinutes, addSession, setPhase, setDoneInCycle],
  )

  const onComplete = useCallback(() => {
    const finished = PHASE_META[stateRef.current.phase]
    chime()
    notify(
      `${finished.label} complete 🌿`,
      stateRef.current.phase === 'focus'
        ? 'Wonderful work — time for a break.'
        : 'Break is over — ready for another gentle push?',
    )
    setCelebrating(true)
    window.setTimeout(() => {
      setCelebrating(false)
      advance(true)
    }, 3200)
  }, [chime, notify, advance])

  const countdown = useCountdown(settings.focusMin * 60_000, {
    onComplete,
    persistKey: userKey(uid, 'pomodoro-timer'),
  })
  const { remainingMs, totalMs, isRunning, start, pause, reset } = countdown

  // honor "auto-start next session" once the new phase is seeded
  useEffect(() => {
    if (autoStartRef.current && !celebrating && !isRunning) {
      autoStartRef.current = false
      start()
    }
  })

  // if durations change while idle at full time, re-seed the phase
  const fullAndIdle = !isRunning && remainingMs === totalMs && !celebrating
  useEffect(() => {
    const target = phaseMinutes(phase) * 60_000
    if (fullAndIdle && target !== totalMs) reset(target)
  }, [fullAndIdle, phase, phaseMinutes, totalMs, reset])

  const meta = PHASE_META[phase]

  // browser tab title mirrors the running timer
  useDocumentTitle(isRunning || remainingMs < totalMs ? `${formatMs(remainingMs)} · ${meta.label}` : null)

  const doReset = useCallback(() => {
    if (celebrating) return
    // abandoning a focus session in progress → gentle wistful Maple
    if (phase === 'focus' && isRunning && remainingMs < totalMs) {
      setAbandoned(true)
      window.setTimeout(() => setAbandoned(false), 4000)
    }
    reset(phaseMinutes(phase) * 60_000)
  }, [celebrating, phase, isRunning, remainingMs, totalMs, reset, phaseMinutes])

  const toggleRun = useCallback(() => {
    if (celebrating) return
    if (isRunning) pause()
    else start()
  }, [celebrating, isRunning, pause, start])

  const doSkip = useCallback(() => {
    if (!celebrating) advance(false)
  }, [celebrating, advance])

  // Space start/pause · R reset · S skip (ignored while typing)
  useKeyboardShortcuts({ ' ': toggleRun, r: doReset, s: doSkip })

  const mood: CompanionMood = celebrating
    ? 'celebrate'
    : abandoned
      ? 'sad'
      : phase === 'shortBreak'
        ? 'sleep'
        : phase === 'longBreak'
          ? 'stretch'
          : isRunning
            ? 'focus'
            : 'idle'

  return (
    <section className="view pomo-view" aria-label="Pomodoro timer">
      <AnimatePresence>{celebrating && <CompletionCelebration />}</AnimatePresence>

      <FocusTaskInput active={isRunning && phase === 'focus'} />

      <div className="pomo-layout">
        <div className="pomo-center">
          <motion.span
            key={celebrating ? 'done' : phase}
            className="chip pomo-phase"
            style={{ background: meta.color, color: '#fffaf0' }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {celebrating ? 'Lovely work! ✨' : meta.label}
          </motion.span>

          <ProgressRing progress={totalMs > 0 ? remainingMs / totalMs : 0} color={meta.color} size={310}>
            <CountdownDisplay ms={remainingMs} label={celebrating ? 'complete!' : meta.hint} />
          </ProgressRing>

          <SessionTimeline
            done={doneInCycle}
            perCycle={settings.sessionsBeforeLongBreak}
            phase={phase}
            isRunning={isRunning}
          />

          <p className="pomo-today">
            {stats.todaySessions > 0
              ? `${stats.todaySessions} ${stats.todaySessions === 1 ? 'session' : 'sessions'} · ${stats.todayMinutes} focused minutes today`
              : 'Your first session of the day awaits.'}
          </p>

          <div className="view-controls">
            {isRunning ? (
              <button className="btn btn-lg btn-warm" onClick={pause}>
                <Pause size={20} aria-hidden="true" /> Pause
              </button>
            ) : (
              <button className="btn btn-lg btn-primary" onClick={start} disabled={celebrating}>
                <Play size={20} aria-hidden="true" /> {remainingMs < totalMs ? 'Resume' : 'Start'}
              </button>
            )}
            <button className="btn" onClick={doReset} disabled={celebrating}>
              <RotateCcw size={18} aria-hidden="true" /> Reset
            </button>
            <button className="btn" onClick={doSkip} disabled={celebrating}>
              <SkipForward size={18} aria-hidden="true" /> Skip
            </button>
          </div>

          <p className="shortcut-hint" aria-hidden="true">
            <kbd>Space</kbd> start/pause · <kbd>R</kbd> reset · <kbd>S</kbd> skip
          </p>
        </div>

        <aside className="pomo-side">
          <CompanionStatus mood={mood} />
          <Collapsible title="Durations">
            <SettingsPanel disabled={isRunning} />
          </Collapsible>
          <Collapsible title="Preferences">
            <NotificationSettings />
          </Collapsible>
        </aside>
      </div>
    </section>
  )
}
