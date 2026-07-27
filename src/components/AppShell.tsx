import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { LogOut, Moon, Sun, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { AmbientBackground } from './AmbientBackground'
import { InstallPrompt } from './InstallPrompt'
import { NavigationTabs } from './NavigationTabs'
import type { TabId } from '../types'
import '../styles/shell.css'

/**
 * AppShell — the signed-in frame: header (logo, sound & theme toggles,
 * user menu with logout), navigation tabs, and an animated main region
 * that cross-fades between tab views.
 */

interface Props {
  active: TabId
  onTabChange: (tab: TabId) => void
  children: ReactNode
}

export function AppShell({ active, onTabChange, children }: Props) {
  const { user, signOut } = useAuth()
  const { settings, update } = useSettings()
  const reduced = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // close the user menu when clicking anywhere else
  useEffect(() => {
    if (!menuOpen) return
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [menuOpen])

  return (
    <div className="shell">
      <AmbientBackground />

      <header className="shell-header">
        <div className="shell-brand">
          <span className="shell-logo" aria-hidden="true">🌿</span>
          <h1>Focus Grove</h1>
        </div>

        <div className="shell-actions">
          <button
            className="btn btn-icon"
            onClick={() => update({ soundOn: !settings.soundOn })}
            aria-label={settings.soundOn ? 'Turn sound off' : 'Turn sound on'}
            title={settings.soundOn ? 'Sound on' : 'Sound off'}
          >
            {settings.soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button
            className="btn btn-icon"
            onClick={() => update({ theme: settings.theme === 'light' ? 'dark' : 'light' })}
            aria-label={settings.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={settings.theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            {settings.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {user && (
            <div className="shell-user" ref={menuRef}>
              <button
                className="shell-user-chip"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <img src={user.avatarUrl} alt="" className="shell-avatar" />
                <span className="shell-user-name">{user.name}</span>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    className="shell-menu card"
                    role="menu"
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                  >
                    <p className="shell-menu-email">{user.email}</p>
                    <button
                      className="btn shell-menu-logout"
                      role="menuitem"
                      onClick={() => void signOut()}
                    >
                      <LogOut size={18} aria-hidden="true" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      <NavigationTabs active={active} onChange={onTabChange} />

      <main className="shell-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="shell-view"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <InstallPrompt />
    </div>
  )
}
