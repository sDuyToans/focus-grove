import { Minus, Plus } from 'lucide-react'
import { useSettings, type Settings } from '../context/SettingsContext'
import '../styles/views.css'

/**
 * SettingsPanel — steppers for the pomodoro durations. Values persist
 * via SettingsContext (localStorage). Rendered inside a collapsible
 * card by PomodoroView; edits are locked while the timer runs.
 */

type NumericKey = 'focusMin' | 'shortBreakMin' | 'longBreakMin'

const FIELDS: { key: NumericKey; label: string; min: number; max: number }[] = [
  { key: 'focusMin', label: 'Focus', min: 5, max: 120 },
  { key: 'shortBreakMin', label: 'Short break', min: 1, max: 30 },
  { key: 'longBreakMin', label: 'Long break', min: 5, max: 60 },
]

interface Props {
  /** Disable edits while a timer is running to avoid confusion. */
  disabled?: boolean
}

export function SettingsPanel({ disabled = false }: Props) {
  const { settings, update } = useSettings()

  const step = (key: NumericKey, delta: number, min: number, max: number) => {
    const next = Math.min(max, Math.max(min, settings[key] + delta))
    update({ [key]: next } as Partial<Settings>)
  }

  return (
    <div className="settings">
      {disabled && <p className="settings-hint">Pause the timer to adjust ✋</p>}
      <div className="settings-grid">
        {FIELDS.map(({ key, label, min, max }) => (
          <div className="settings-row" key={key}>
            <span className="settings-label">{label}</span>
            <div className="settings-stepper">
              <button
                className="btn btn-icon settings-step"
                onClick={() => step(key, -5, min, max)}
                disabled={disabled || settings[key] <= min}
                aria-label={`Decrease ${label} duration`}
              >
                <Minus size={16} />
              </button>
              <span className="settings-value">{settings[key]}m</span>
              <button
                className="btn btn-icon settings-step"
                onClick={() => step(key, 5, min, max)}
                disabled={disabled || settings[key] >= max}
                aria-label={`Increase ${label} duration`}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
