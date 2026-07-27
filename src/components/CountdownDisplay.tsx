import { formatMs } from '../hooks/useCountdown'
import '../styles/ui.css'

/**
 * CountdownDisplay — big friendly time readout with an optional label.
 * Uses tabular numerals so digits don't wiggle as they change.
 */

interface Props {
  ms: number
  label?: string
  /** 'lg' for the pomodoro/timer rings, 'md' for compact spots. */
  size?: 'lg' | 'md'
}

export function CountdownDisplay({ ms, label, size = 'lg' }: Props) {
  return (
    <div className={`countdown countdown-${size}`} role="timer" aria-live="polite">
      <span className="countdown-time">{formatMs(ms)}</span>
      {label && <span className="countdown-label">{label}</span>}
    </div>
  )
}
