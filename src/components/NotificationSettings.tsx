import { Bell, BellOff, PlayCircle, Volume2, VolumeX } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { useNotifications } from '../hooks/useNotifications'
import '../styles/views.css'

/**
 * NotificationSettings — sound, browser-notification and auto-start
 * preferences. Notification permission is requested only at the moment
 * the user turns the toggle on; a denied permission shows a gentle
 * explanation instead of a broken toggle.
 */

function Toggle({
  checked,
  onChange,
  label,
  icon,
}: {
  checked: boolean
  onChange: () => void
  label: string
  icon: React.ReactNode
}) {
  return (
    <button
      className={`pref-toggle ${checked ? 'pref-toggle-on' : ''}`}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
    >
      {icon}
      <span className="pref-toggle-label">{label}</span>
      <span className="pref-toggle-pill" aria-hidden="true">
        <span className="pref-toggle-knob" />
      </span>
    </button>
  )
}

export function NotificationSettings() {
  const { settings, update } = useSettings()
  const { supported, permission, requestPermission } = useNotifications(settings.notificationsOn)

  const toggleNotifications = async () => {
    if (settings.notificationsOn) {
      update({ notificationsOn: false })
      return
    }
    // ask for permission only now, on the user's explicit gesture
    const result = await requestPermission()
    if (result === 'granted') update({ notificationsOn: true })
  }

  return (
    <div className="prefs">
      <div className="prefs-list">
        <Toggle
          checked={settings.soundOn}
          onChange={() => update({ soundOn: !settings.soundOn })}
          label="Completion sound"
          icon={settings.soundOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
        />
        {supported && (
          <Toggle
            checked={settings.notificationsOn && permission === 'granted'}
            onChange={() => void toggleNotifications()}
            label="Browser notifications"
            icon={settings.notificationsOn ? <Bell size={19} /> : <BellOff size={19} />}
          />
        )}
        <Toggle
          checked={settings.autoStartNext}
          onChange={() => update({ autoStartNext: !settings.autoStartNext })}
          label="Auto-start next session"
          icon={<PlayCircle size={19} />}
        />
      </div>
      {supported && permission === 'denied' && (
        <p className="settings-hint">
          Notifications are blocked in your browser settings — allow them for this site to get a
          nudge when timers finish.
        </p>
      )}
    </div>
  )
}
