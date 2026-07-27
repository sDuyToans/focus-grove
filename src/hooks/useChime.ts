import { useCallback, useRef } from 'react'

/**
 * A gentle two-note completion chime rendered with the Web Audio API —
 * no audio files needed. Returns a `play` function; it no-ops when the
 * user has sound turned off.
 */
export function useChime(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)

  return useCallback(() => {
    if (!enabled) return
    try {
      ctxRef.current ??= new AudioContext()
      const ctx = ctxRef.current
      if (ctx.state === 'suspended') void ctx.resume()

      const note = (freq: number, at: number, dur: number, gainPeak: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.0001, at)
        gain.gain.exponentialRampToValueAtTime(gainPeak, at + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)
        osc.connect(gain).connect(ctx.destination)
        osc.start(at)
        osc.stop(at + dur + 0.05)
      }

      const t = ctx.currentTime
      note(523.25, t, 1.1, 0.12) // C5
      note(783.99, t + 0.18, 1.4, 0.1) // G5
    } catch {
      /* audio unavailable — stay silent */
    }
  }, [enabled])
}
