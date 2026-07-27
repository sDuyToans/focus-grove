import { useCallback, useEffect, useRef, useState } from 'react'

export interface CountdownControls {
  /** Milliseconds left on the clock. */
  remainingMs: number
  /** Total duration the countdown was configured with. */
  totalMs: number
  isRunning: boolean
  isFinished: boolean
  start: () => void
  pause: () => void
  /** Reset to `totalMs` (or a new total) and stop. */
  reset: (newTotalMs?: number) => void
}

export interface CountdownOptions {
  onComplete?: () => void
  /**
   * When set, the timer persists to localStorage under this key and is
   * restored on the next mount — a running timer survives reloads and
   * even completes "while you were away" (onComplete fires on mount).
   */
  persistKey?: string
}

/** Shape stored in localStorage for persisted timers. */
interface PersistedTimer {
  /** Absolute end timestamp while running, null while paused. */
  endAt: number | null
  remainingMs: number
  totalMs: number
}

function isPersistedTimer(v: unknown): v is PersistedTimer {
  const p = v as PersistedTimer
  return (
    !!p &&
    typeof p === 'object' &&
    (p.endAt === null || typeof p.endAt === 'number') &&
    typeof p.remainingMs === 'number' &&
    typeof p.totalMs === 'number' &&
    p.totalMs > 0
  )
}

interface InitialState {
  totalMs: number
  remainingMs: number
  isRunning: boolean
  /** True when a persisted running timer expired while the app was closed. */
  expiredWhileAway: boolean
  endAt: number | null
}

/** Restore persisted state (safely — corrupted data is discarded). */
function restore(persistKey: string | undefined, fallbackTotal: number): InitialState {
  const fresh: InitialState = {
    totalMs: fallbackTotal,
    remainingMs: fallbackTotal,
    isRunning: false,
    expiredWhileAway: false,
    endAt: null,
  }
  if (!persistKey) return fresh
  try {
    const raw = localStorage.getItem(persistKey)
    if (!raw) return fresh
    const data: unknown = JSON.parse(raw)
    if (!isPersistedTimer(data)) throw new Error('invalid persisted timer')
    if (data.endAt !== null) {
      const left = data.endAt - Date.now()
      if (left <= 0) {
        // finished while we were away — report zero and flag completion
        return { ...fresh, totalMs: data.totalMs, remainingMs: 0, expiredWhileAway: true }
      }
      return {
        totalMs: data.totalMs,
        remainingMs: left,
        isRunning: true,
        expiredWhileAway: false,
        endAt: data.endAt,
      }
    }
    return { ...fresh, totalMs: data.totalMs, remainingMs: data.remainingMs }
  } catch {
    try {
      localStorage.removeItem(persistKey)
    } catch {
      /* ignore */
    }
    return fresh
  }
}

/**
 * useCountdown — an accurate countdown built on wall-clock timestamps
 * instead of tick accumulation, so it stays correct even when the tab
 * is backgrounded/throttled or the device is locked. While running we
 * store the absolute end time and recompute `remaining = endAt - now`
 * on every tick and on visibility changes.
 *
 * With `persistKey` set it also survives full page reloads (see
 * CountdownOptions). All intervals and listeners are cleaned up on
 * unmount.
 */
export function useCountdown(
  initialTotalMs: number,
  options: CountdownOptions = {},
): CountdownControls {
  const { onComplete, persistKey } = options

  // restore persisted state exactly once per mount
  const initRef = useRef<InitialState | null>(null)
  initRef.current ??= restore(persistKey, initialTotalMs)
  const init = initRef.current

  const [totalMs, setTotalMs] = useState(init.totalMs)
  const [remainingMs, setRemainingMs] = useState(init.remainingMs)
  const [isRunning, setIsRunning] = useState(init.isRunning)

  const endAtRef = useRef<number | null>(init.endAt)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const persist = useCallback(
    (data: PersistedTimer) => {
      if (!persistKey) return
      try {
        localStorage.setItem(persistKey, JSON.stringify(data))
      } catch {
        /* storage unavailable */
      }
    },
    [persistKey],
  )

  // fire the "completed while away" callback once, after mount
  const firedAwayRef = useRef(false)
  useEffect(() => {
    if (init.expiredWhileAway && !firedAwayRef.current) {
      firedAwayRef.current = true
      persist({ endAt: null, remainingMs: 0, totalMs: init.totalMs })
      onCompleteRef.current?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tick = useCallback(() => {
    if (endAtRef.current === null) return
    const left = Math.max(0, endAtRef.current - Date.now())
    setRemainingMs(left)
    if (left <= 0) {
      endAtRef.current = null
      setIsRunning(false)
      setTotalMs((t) => {
        persist({ endAt: null, remainingMs: 0, totalMs: t })
        return t
      })
      onCompleteRef.current?.()
    }
  }, [persist])

  useEffect(() => {
    if (!isRunning) return
    const id = window.setInterval(tick, 200)
    // recompute immediately when the tab becomes visible again
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [isRunning, tick])

  const start = useCallback(() => {
    setRemainingMs((left) => {
      const from = left > 0 ? left : totalMs
      endAtRef.current = Date.now() + from
      persist({ endAt: endAtRef.current, remainingMs: from, totalMs })
      return from
    })
    setIsRunning(true)
  }, [totalMs, persist])

  const pause = useCallback(() => {
    if (endAtRef.current !== null) {
      const left = Math.max(0, endAtRef.current - Date.now())
      setRemainingMs(left)
      endAtRef.current = null
      persist({ endAt: null, remainingMs: left, totalMs })
    }
    setIsRunning(false)
  }, [persist, totalMs])

  const reset = useCallback(
    (newTotalMs?: number) => {
      endAtRef.current = null
      setIsRunning(false)
      const total = newTotalMs ?? totalMs
      if (newTotalMs !== undefined) setTotalMs(newTotalMs)
      setRemainingMs(total)
      persist({ endAt: null, remainingMs: total, totalMs: total })
    },
    [totalMs, persist],
  )

  return {
    remainingMs,
    totalMs,
    isRunning,
    isFinished: remainingMs <= 0,
    start,
    pause,
    reset,
  }
}

/** Format milliseconds as m:ss or h:mm:ss. */
export function formatMs(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}
