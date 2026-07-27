import { Cloud, CloudOff, Loader2 } from 'lucide-react'
import { useSessions } from '../hooks/useSessions'
import '../styles/views.css'

/**
 * SyncStatus — a small friendly pill describing where the user's data
 * lives right now. Hidden entirely in mock/local mode (nothing to say),
 * and calm rather than alarming when offline: sessions are always saved
 * locally first, so nothing is ever lost.
 */
export function SyncStatus() {
  const { syncState, pendingCount } = useSessions()

  if (syncState === 'local') return null

  const view = {
    syncing: {
      icon: <Loader2 size={14} className="sync-spin" aria-hidden="true" />,
      text: 'Syncing your garden…',
    },
    synced: {
      icon: <Cloud size={14} aria-hidden="true" />,
      text: 'Synced to your account',
    },
    offline: {
      icon: <CloudOff size={14} aria-hidden="true" />,
      text:
        pendingCount > 0
          ? `${pendingCount} session${pendingCount === 1 ? '' : 's'} saved locally — will sync when you're back online`
          : "Saved locally — will sync when you're back online",
    },
  }[syncState]

  return (
    <p className={`sync-status sync-${syncState}`} role="status">
      {view.icon}
      <span>{view.text}</span>
    </p>
  )
}
