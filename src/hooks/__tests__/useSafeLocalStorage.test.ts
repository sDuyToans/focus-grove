import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSafeLocalStorage, userKey } from '../useSafeLocalStorage'

describe('useSafeLocalStorage', () => {
  beforeEach(() => localStorage.clear())

  it('reads and writes values', () => {
    const { result } = renderHook(() => useSafeLocalStorage('k', 1))
    expect(result.current[0]).toBe(1)
    act(() => result.current[1](5))
    expect(JSON.parse(localStorage.getItem('k')!)).toBe(5)
  })

  it('recovers from corrupted JSON and repairs the bad key', () => {
    localStorage.setItem('k', '{{{definitely not json')
    const { result } = renderHook(() => useSafeLocalStorage('k', 'fallback'))
    expect(result.current[0]).toBe('fallback')
    // the corrupted value has been replaced with valid JSON
    expect(JSON.parse(localStorage.getItem('k')!)).toBe('fallback')
  })

  it('rejects values that fail validation', () => {
    localStorage.setItem('k', JSON.stringify({ nope: true }))
    const isNumber = (v: unknown): v is number => typeof v === 'number'
    const { result } = renderHook(() => useSafeLocalStorage('k', 42, isNumber))
    expect(result.current[0]).toBe(42)
  })

  it('re-reads when the key changes (user switch)', () => {
    localStorage.setItem(userKey('a', 'x'), JSON.stringify('alice'))
    localStorage.setItem(userKey('b', 'x'), JSON.stringify('bob'))
    const { result, rerender } = renderHook(({ uid }) => useSafeLocalStorage(userKey(uid, 'x'), ''), {
      initialProps: { uid: 'a' },
    })
    expect(result.current[0]).toBe('alice')
    rerender({ uid: 'b' })
    expect(result.current[0]).toBe('bob')
  })
})
