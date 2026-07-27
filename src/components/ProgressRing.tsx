import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import '../styles/ui.css'

/**
 * ProgressRing — an SVG countdown ring: a dashed hand-drawn track with a
 * smooth colored arc that empties as time passes. Children render in the
 * center (usually a CountdownDisplay).
 */

interface Props {
  /** 0 → 1, fraction of time remaining. */
  progress: number
  size?: number
  color?: string
  children?: ReactNode
}

export function ProgressRing({ progress, size = 300, color = 'var(--sage)', children }: Props) {
  const reduced = useReducedMotion()
  const stroke = 12
  const r = (size - stroke * 2 - 10) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.min(1, Math.max(0, progress))

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="presentation">
        {/* dashed sketchy track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring-track"
          strokeWidth={stroke - 6}
          strokeDasharray="2 9"
        />
        {/* remaining-time arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring-arc"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={reduced ? { duration: 0 } : { duration: 0.35, ease: 'linear' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}
