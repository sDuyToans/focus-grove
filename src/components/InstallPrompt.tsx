import { AnimatePresence, motion } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSafeLocalStorage } from '../hooks/useSafeLocalStorage'
import '../styles/views.css'

/**
 * InstallPrompt — a small dismissible chip that appears when the
 * browser fires `beforeinstallprompt` (Chromium PWA install). Dismissal
 * is remembered so it never nags.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useSafeLocalStorage(
    'focus-grove:install-dismissed',
    false,
    (v): v is boolean => typeof v === 'boolean',
  )

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    setDeferred(null)
  }

  return (
    <AnimatePresence>
      {deferred && !dismissed && (
        <motion.div
          className="install card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
        >
          <span>Keep Focus Grove on your home screen 🌿</span>
          <button className="btn btn-primary" onClick={() => void install()}>
            <Download size={16} aria-hidden="true" /> Install
          </button>
          <button
            className="btn btn-icon"
            aria-label="Dismiss install suggestion"
            onClick={() => setDismissed(true)}
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
