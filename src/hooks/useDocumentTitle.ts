import { useEffect } from 'react'

const DEFAULT_TITLE = 'Focus Grove'

/**
 * useDocumentTitle — keeps the browser tab title in sync with the
 * timer (e.g. "24:32 — Focus Grove") and restores the default when the
 * component unmounts or `title` becomes null.
 */
export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    document.title = title ? `${title} — ${DEFAULT_TITLE}` : DEFAULT_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title])
}
