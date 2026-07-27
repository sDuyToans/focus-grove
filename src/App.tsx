import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SessionsProvider } from './context/SessionsContext'
import { SettingsProvider } from './context/SettingsContext'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { AppShell } from './components/AppShell'
import { AuthScreen } from './components/AuthScreen'
import { ClockView } from './components/ClockView'
import { GardenView } from './components/GardenView'
import { PomodoroView } from './components/PomodoroView'
import { TimerView } from './components/TimerView'
import type { TabId } from './types'

/**
 * App — providers + the signed-in/signed-out switch. Each tab view stays
 * self-contained; AppShell handles chrome and animated transitions.
 * A short splash covers the moment the auth adapter restores a session.
 */

function Root() {
  const { user, isInitializing } = useAuth()
  const [tab, setTab] = useState<TabId>('clock')

  if (isInitializing) {
    return (
      <div className="app-splash" role="status" aria-label="Loading Focus Grove">
        <span aria-hidden="true">🌿</span>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <AppShell active={tab} onTabChange={setTab}>
            {tab === 'clock' && <ClockView />}
            {tab === 'pomodoro' && <PomodoroView />}
            {tab === 'timer' && <TimerView />}
            {tab === 'garden' && <GardenView />}
          </AppShell>
        </motion.div>
      ) : (
        <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <AuthScreen />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AppErrorBoundary>
      {/* SettingsProvider and SessionsProvider live inside AuthProvider
          so they can sync the signed-in user's data with Supabase */}
      <AuthProvider>
        <SettingsProvider>
          <SessionsProvider>
            <Root />
          </SessionsProvider>
        </SettingsProvider>
      </AuthProvider>
    </AppErrorBoundary>
  )
}
