import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatMs, useCountdown } from '../useCountdown'

/**
 * useCountdown is wall-clock based: these tests drive both the fake
 * interval timers AND the mocked system clock together to prove the
 * remaining time never drifts — even when ticks are withheld entirely
 * (the hidden-tab / locked-device case).
 */

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T09:00:00Z'))
    localStorage.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts and counts down', () => {
    const { result } = renderHook(() => useCountdown(60_000))
    expect(result.current.remainingMs).toBe(60_000)
    expect(result.current.isRunning).toBe(false)

    act(() => result.current.start())
    expect(result.current.isRunning).toBe(true)

    act(() => vi.advanceTimersByTime(5_000))
    expect(result.current.remainingMs).toBeLessThanOrEqual(55_000)
    expect(result.current.remainingMs).toBeGreaterThan(54_000)
  })

  it('pauses and holds the remaining time', () => {
    const { result } = renderHook(() => useCountdown(60_000))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(10_000))
    act(() => result.current.pause())

    const heldAt = result.current.remainingMs
    expect(result.current.isRunning).toBe(false)

    act(() => vi.advanceTimersByTime(30_000)) // time passes while paused
    expect(result.current.remainingMs).toBe(heldAt)

    // resume continues from where it left off
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(1_000))
    expect(result.current.remainingMs).toBeLessThan(heldAt)
  })

  it('resets to the full duration (and accepts a new total)', () => {
    const { result } = renderHook(() => useCountdown(60_000))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(20_000))

    act(() => result.current.reset())
    expect(result.current.remainingMs).toBe(60_000)
    expect(result.current.isRunning).toBe(false)

    act(() => result.current.reset(90_000))
    expect(result.current.totalMs).toBe(90_000)
    expect(result.current.remainingMs).toBe(90_000)
  })

  it('fires onComplete exactly once when it reaches zero', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useCountdown(3_000, { onComplete }))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(4_000))

    expect(result.current.remainingMs).toBe(0)
    expect(result.current.isFinished).toBe(true)
    expect(result.current.isRunning).toBe(false)
    expect(onComplete).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(2_000))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('stays accurate when the tab is hidden (no interval ticks fire)', () => {
    const { result } = renderHook(() => useCountdown(120_000))
    act(() => result.current.start())

    // simulate a throttled background tab: the wall clock advances but
    // no interval callbacks run at all
    act(() => {
      vi.setSystemTime(Date.now() + 45_000)
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // one visibilitychange recompute is enough to catch up exactly
    expect(result.current.remainingMs).toBe(75_000)
  })

  it('completes while hidden and reports on the next visibility change', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useCountdown(10_000, { onComplete }))
    act(() => result.current.start())

    act(() => {
      vi.setSystemTime(Date.now() + 60_000) // way past the end
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current.remainingMs).toBe(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('persists and restores a paused timer via persistKey', () => {
    const key = 'test:persist'
    const first = renderHook(() => useCountdown(60_000, { persistKey: key }))
    act(() => first.result.current.start())
    act(() => vi.advanceTimersByTime(20_000))
    act(() => first.result.current.pause())
    const held = first.result.current.remainingMs
    first.unmount()

    // "reload": a fresh mount restores the paused remaining time
    const second = renderHook(() => useCountdown(60_000, { persistKey: key }))
    expect(second.result.current.remainingMs).toBe(held)
    expect(second.result.current.isRunning).toBe(false)
  })

  it('completes a running persisted timer that expired while away', () => {
    const key = 'test:expired'
    const first = renderHook(() => useCountdown(5_000, { persistKey: key }))
    act(() => first.result.current.start())
    first.unmount()

    // the app was closed while the timer ran out
    vi.setSystemTime(Date.now() + 60_000)

    const onComplete = vi.fn()
    const second = renderHook(() => useCountdown(5_000, { persistKey: key, onComplete }))
    expect(second.result.current.remainingMs).toBe(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('recovers from corrupted persisted data', () => {
    const key = 'test:corrupt'
    localStorage.setItem(key, '{not json!!')
    const { result } = renderHook(() => useCountdown(30_000, { persistKey: key }))
    expect(result.current.remainingMs).toBe(30_000)
    expect(result.current.isRunning).toBe(false)
    expect(localStorage.getItem(key)).toBeNull() // bad data was cleared
  })
})

describe('formatMs', () => {
  it('formats minutes and hours', () => {
    expect(formatMs(0)).toBe('0:00')
    expect(formatMs(65_000)).toBe('1:05')
    expect(formatMs(3_600_000)).toBe('1:00:00')
    expect(formatMs(25 * 60_000)).toBe('25:00')
  })
})
