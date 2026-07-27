import { useAuth } from '../context/AuthContext'
import { useSafeLocalStorage, userKey } from './useSafeLocalStorage'

/**
 * Session data now lives in SessionsContext (src/context) so the whole
 * app shares one offline-first Supabase sync — re-exported here to keep
 * existing imports working.
 */
export { useSessions } from '../context/SessionsContext'

/** The user's current focus intention ("What are you focusing on?"). */
export function useFocusTask() {
  const { user } = useAuth()
  const uid = user?.id ?? 'anonymous'
  const [task, setTask] = useSafeLocalStorage<string>(
    userKey(uid, 'task'),
    '',
    (v): v is string => typeof v === 'string',
  )
  return [task, setTask] as const
}
