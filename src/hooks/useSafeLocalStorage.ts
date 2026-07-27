import { useCallback, useEffect, useState } from 'react'

/**
 * useSafeLocalStorage — persistent useState that survives bad data.
 *
 * - Reads lazily on mount; anything unparseable (or rejected by the
 *   optional `validate` guard) is discarded and the corrupted key is
 *   removed so it can't break future loads.
 * - Writes on every change; storage failures (private mode, quota) are
 *   swallowed so the app keeps working in-memory.
 */
export function useSafeLocalStorage<T>(
  key: string,
  initial: T,
  validate?: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(() => readSafe(key, initial, validate))

  // re-read when the key changes (e.g. a different user signs in)
  useEffect(() => {
    setValue(readSafe(key, initial, validate))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage unavailable — keep state in memory only */
    }
  }, [key, value])

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
    setValue(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setValue, clear] as const
}

function readSafe<T>(key: string, initial: T, validate?: (v: unknown) => v is T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return initial
    const parsed: unknown = JSON.parse(raw)
    if (validate && !validate(parsed)) throw new Error('failed validation')
    return parsed as T
  } catch {
    // corrupted or invalid — drop it so next load is clean
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
    return initial
  }
}

/** Namespaces a storage key per signed-in user so data never mixes. */
export function userKey(userId: string, suffix: string) {
  return `focus-grove:${userId}:${suffix}`
}
