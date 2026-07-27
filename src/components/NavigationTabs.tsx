import { motion } from 'framer-motion'
import { Clock3, Flower2, Hourglass, Sprout } from 'lucide-react'
import type { TabId } from '../types'
import '../styles/ui.css'

/**
 * NavigationTabs — the illustrated bottom-of-header tab bar. The active
 * tab gets a shared-layout "pebble" that slides between tabs.
 */

const TABS: { id: TabId; label: string; Icon: typeof Clock3 }[] = [
  { id: 'clock', label: 'Clock', Icon: Clock3 },
  { id: 'pomodoro', label: 'Pomodoro', Icon: Flower2 },
  { id: 'timer', label: 'Timer', Icon: Hourglass },
  { id: 'garden', label: 'Garden', Icon: Sprout },
]

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
}

export function NavigationTabs({ active, onChange }: Props) {
  return (
    <nav className="tabs" aria-label="Main navigation">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = id === active
        return (
          <button
            key={id}
            className={`tab ${isActive ? 'tab-active' : ''}`}
            onClick={() => onChange(id)}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive && (
              <motion.span
                layoutId="tab-pebble"
                className="tab-pebble"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <Icon size={20} strokeWidth={2.4} aria-hidden="true" />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
