import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'
import { useSettings } from '../context/SettingsContext'
import { useNow } from '../hooks/useNow'
import '../styles/ambient.css'

/**
 * AmbientBackground — a fixed, non-interactive layer that follows the
 * time of day (checked once a minute):
 *
 *   morning   (5–11)  warm sun glow + drifting leaves
 *   afternoon (11–17) soft floating dust motes
 *   evening   (17–21) warmer terracotta tones + slow leaves
 *   night     (21–5)  stars, fireflies and a moonlit glow
 *
 * Dark theme always shows the night scene. Positions are seeded
 * deterministically so the scene never jumps between renders, and the
 * whole layer is hidden under reduced motion.
 */

type Period = 'morning' | 'afternoon' | 'evening' | 'night'

function periodFor(hour: number): Period {
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

interface Particle {
  left: number // vw
  top: number // vh
  size: number
  duration: number
  delay: number
  sway: number
}

function seeded(count: number): Particle[] {
  // simple deterministic pseudo-random so the layout never jumps
  let s = 42
  const rnd = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  return Array.from({ length: count }, () => ({
    left: rnd() * 96,
    top: rnd() * 90,
    size: 10 + rnd() * 14,
    duration: 14 + rnd() * 16,
    delay: -rnd() * 20,
    sway: 12 + rnd() * 26,
  }))
}

const LEAF_PATH = 'M12 2 Q22 8 12 22 Q2 8 12 2 M12 5 L12 19'

function Leaf({ p }: { p: Particle }) {
  return (
    <motion.svg
      className="ambient-leaf"
      viewBox="0 0 24 24"
      style={{ left: `${p.left}vw`, top: `${p.top}vh`, width: p.size, height: p.size }}
      animate={{
        y: [0, 24, 0],
        x: [0, p.sway, 0, -p.sway / 2, 0],
        rotate: [0, 50, 0, -35, 0],
      }}
      transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
    >
      <path d={LEAF_PATH} />
    </motion.svg>
  )
}

function Dust({ p }: { p: Particle }) {
  return (
    <motion.span
      className="ambient-dust"
      style={{ left: `${p.left}vw`, top: `${p.top}vh`, width: p.size / 2.6, height: p.size / 2.6 }}
      animate={{ y: [0, -30, 0], x: [0, p.sway / 2, 0], opacity: [0.15, 0.5, 0.15] }}
      transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
    />
  )
}

function Star({ p, firefly }: { p: Particle; firefly: boolean }) {
  return (
    <motion.span
      className={firefly ? 'ambient-firefly' : 'ambient-star'}
      style={{ left: `${p.left}vw`, top: `${p.top}vh`, width: p.size / 2.4, height: p.size / 2.4 }}
      animate={
        firefly
          ? { opacity: [0, 0.9, 0], x: [0, p.sway, p.sway / 3], y: [0, -p.sway / 2, 6] }
          : { opacity: [0.15, 0.75, 0.15], scale: [1, 1.25, 1] }
      }
      transition={{
        duration: firefly ? p.duration / 2 : p.duration / 3,
        repeat: Infinity,
        delay: p.delay / 3,
        ease: 'easeInOut',
      }}
    />
  )
}

export function AmbientBackground() {
  const reduced = useReducedMotion()
  const { settings } = useSettings()
  const now = useNow(60_000)
  const particles = useMemo(() => seeded(12), [])

  const period: Period = settings.theme === 'dark' ? 'night' : periodFor(now.getHours())

  if (reduced) return null

  return (
    <div className={`ambient ambient-${period}`} aria-hidden="true">
      {particles.map((p, i) => {
        switch (period) {
          case 'night':
            return <Star key={i} p={p} firefly={i % 4 === 0} />
          case 'afternoon':
            return <Dust key={i} p={p} />
          default:
            return <Leaf key={i} p={p} />
        }
      })}
      {/* soft scene blobs — sun / warm dusk / moonlight per period */}
      <div className="ambient-blob ambient-blob-a" />
      <div className="ambient-blob ambient-blob-b" />
      {period === 'morning' && <div className="ambient-sun" />}
      {period === 'night' && <div className="ambient-moon" />}
    </div>
  )
}
