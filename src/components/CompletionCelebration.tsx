import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'
import '../styles/views.css'

/**
 * CompletionCelebration — a brief shower of soft confetti (leaves,
 * petals, sparkle dots in the app palette) rendered over the current
 * view when a session completes. Purely decorative; renders nothing
 * under reduced motion.
 */

const COLORS = ['var(--sage)', 'var(--yellow)', 'var(--terracotta)', 'var(--blue)']

export function CompletionCelebration() {
  const reduced = useReducedMotion()

  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: 8 + ((i * 37) % 85), // deterministic spread
        delay: (i % 6) * 0.12,
        drift: ((i * 13) % 40) - 20,
        size: 7 + ((i * 7) % 8),
        color: COLORS[i % COLORS.length],
        round: i % 3 === 0,
      })),
    [],
  )

  if (reduced) return null

  return (
    <div className="celebration" aria-hidden="true">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="celebration-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            background: p.color,
            borderRadius: p.round ? '50%' : '40% 60% 55% 45%',
          }}
          initial={{ y: -30, opacity: 0, rotate: 0 }}
          animate={{ y: '70vh', opacity: [0, 1, 1, 0], x: p.drift, rotate: 320 }}
          transition={{ duration: 2.6, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}
