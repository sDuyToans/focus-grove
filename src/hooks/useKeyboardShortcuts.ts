import { useEffect, useRef } from 'react'

type ShortcutMap = Record<string, () => void>

/**
 * useKeyboardShortcuts — maps single keys (e.g. ' ', 'r', 's') to
 * actions. Ignores events while the user is typing in an input,
 * textarea, select or contentEditable element, and any event with
 * modifier keys held (so browser shortcuts keep working).
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  const mapRef = useRef(shortcuts)
  mapRef.current = shortcuts

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      )
        return

      const action = mapRef.current[e.key.toLowerCase()]
      if (action) {
        e.preventDefault()
        action()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
