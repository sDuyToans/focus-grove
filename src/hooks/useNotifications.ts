import { useCallback, useEffect, useState } from 'react'

/**
 * useNotifications — browser notification support with polite
 * permission handling: we only ask for permission when the user
 * actively enables notifications (never on page load).
 */
export function useNotifications(enabled: boolean) {
  const supported = typeof window !== 'undefined' && 'Notification' in window
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : 'denied',
  )

  // ask exactly when the user flips the toggle on (user gesture)
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!supported) return 'denied'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [supported])

  // keep our copy fresh if the user changes it in browser settings
  useEffect(() => {
    if (supported) setPermission(Notification.permission)
  }, [supported, enabled])

  const notify = useCallback(
    (title: string, body: string) => {
      if (!enabled || !supported || Notification.permission !== 'granted') return
      try {
        const n = new Notification(title, { body, icon: '/favicon.svg', silent: true })
        // auto-dismiss so notifications never pile up
        setTimeout(() => n.close(), 8000)
      } catch {
        /* some platforms (iOS Safari) throw — fail quietly */
      }
    },
    [enabled, supported],
  )

  return { supported, permission, requestPermission, notify }
}
