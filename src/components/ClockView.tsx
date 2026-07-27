import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Focus, Undo2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNow } from '../hooks/useNow'
import { AnimalCompanion } from './AnimalCompanion'
import '../styles/views.css'

/**
 * ClockView — a big friendly clock with the date and a motivational
 * message that changes with the time of day.
 *
 * FOCUS MODE is a little ritual, not just a toggle:
 *  - sets `data-focus="on"` on <html>, which CSS uses to melt away the
 *    header and tabs (they come back on hover, see shell.css)
 *  - a warm vignette closes in around the clock
 *  - the clock card lifts, scales up and gains a slow breathing halo
 *  - Maple switches to her determined focus pose
 *  - an "in focus for…" counter quietly tracks the streak
 */

const MESSAGES: { until: number; text: string }[] = [
  { until: 5, text: 'The world is quiet — rest well, night owl.' },
  { until: 9, text: 'A gentle morning makes a strong day. ☕' },
  { until: 12, text: 'Fresh mind, fresh start — one thing at a time.' },
  { until: 15, text: 'Steady afternoon steps take you far.' },
  { until: 18, text: 'A short breath now, then one more good push.' },
  { until: 22, text: 'Wind down softly — you did enough today.' },
  { until: 24, text: 'Stars are out. Be kind to tomorrow-you.' },
]

function messageFor(hour: number) {
  return MESSAGES.find((m) => hour < m.until)?.text ?? MESSAGES[0].text
}

function elapsedLabel(sinceMs: number, now: Date) {
  const min = Math.floor((now.getTime() - sinceMs) / 60_000)
  if (min < 1) return 'just settled in'
  if (min === 1) return 'in focus for 1 minute'
  if (min < 60) return `in focus for ${min} minutes`
  const h = Math.floor(min / 60)
  return `in focus for ${h}h ${min % 60}m`
}

export function ClockView() {
  const now = useNow()
  const reduced = useReducedMotion()
  const [focusMode, setFocusMode] = useState(false)
  const [focusedAt, setFocusedAt] = useState<number | null>(null)

  // mirror focus mode onto <html> so shell.css can dim header & tabs
  useEffect(() => {
    document.documentElement.dataset.focus = focusMode ? 'on' : 'off'
    return () => {
      // never leave the chrome dimmed when navigating away
      document.documentElement.dataset.focus = 'off'
    }
  }, [focusMode])

  const toggleFocus = () => {
    setFocusMode((f) => {
      setFocusedAt(f ? null : Date.now())
      return !f
    })
  }

  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const seconds = now.getSeconds().toString().padStart(2, '0')
  const date = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <section className={`view clock-view ${focusMode ? 'clock-focused' : ''}`} aria-label="Clock">
      {/* warm vignette that closes in when focus mode starts */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            className="clock-vignette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 1.1, ease: 'easeOut' }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.div
        className="clock-row"
        animate={reduced ? undefined : { scale: focusMode ? 1.06 : 1, y: focusMode ? 8 : 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        <AnimalCompanion mood={focusMode ? 'focus' : 'idle'} size={190} />

        <div className="clock-face-wrap">
          {/* slow breathing halo behind the card while focused */}
          {focusMode && !reduced && (
            <motion.span
              className="clock-halo"
              aria-hidden="true"
              animate={{ scale: [1, 1.07, 1], opacity: [0.5, 0.85, 0.5] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <div className="clock-face card">
            <motion.p
              className="clock-time"
              key={time}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
            >
              {time}
              <span className="clock-seconds">:{seconds}</span>
            </motion.p>
            <p className="clock-date">{date}</p>
            <AnimatePresence mode="wait">
              <motion.p
                className="clock-message"
                key={focusMode ? 'focus-msg' : 'day-msg'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
              >
                {focusMode && focusedAt !== null
                  ? `🌿 ${elapsedLabel(focusedAt, now)}`
                  : `“${messageFor(now.getHours())}”`}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <motion.button
        className={`btn ${focusMode ? '' : 'btn-primary'}`}
        onClick={toggleFocus}
        aria-pressed={focusMode}
        whileTap={reduced ? undefined : { scale: 0.95 }}
      >
        {focusMode ? (
          <>
            <Undo2 size={18} aria-hidden="true" /> Leave focus mode
          </>
        ) : (
          <>
            <Focus size={18} aria-hidden="true" /> Enter focus mode
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {focusMode && (
          <motion.p
            className="clock-focus-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: reduced ? 0 : 0.8, duration: 0.6 }}
          >
            Everything else can wait. Breathe with the glow. 🌱
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  )
}
