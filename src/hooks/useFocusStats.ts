import { useMemo } from 'react'
import type { FocusSession, FocusStats } from '../types'

/**
 * useFocusStats — turns the raw session list into the cozy numbers the
 * Garden tab shows: today's minutes & sessions, the day streak, the
 * 7-day activity strip, and history grouped by date.
 */

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(t: number | Date) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function useFocusStats(sessions: FocusSession[]): FocusStats {
  return useMemo(() => {
    const today = startOfDay(Date.now())

    // minutes/sessions per day-start timestamp
    const perDay = new Map<number, { minutes: number; sessions: number }>()
    for (const s of sessions) {
      const day = startOfDay(s.completedAt)
      const acc = perDay.get(day) ?? { minutes: 0, sessions: 0 }
      acc.minutes += s.durationMin
      acc.sessions += 1
      perDay.set(day, acc)
    }

    // streak: consecutive active days ending today (or yesterday, so an
    // unfinished today doesn't zero the streak)
    let streakDays = 0
    let cursor = perDay.has(today) ? today : today - DAY_MS
    while (perDay.has(cursor)) {
      streakDays += 1
      cursor -= DAY_MS
    }

    const week = Array.from({ length: 7 }, (_, i) => {
      const day = today - (6 - i) * DAY_MS
      const acc = perDay.get(day)
      return { date: new Date(day), minutes: acc?.minutes ?? 0, sessions: acc?.sessions ?? 0 }
    })

    // grouped history, newest day first
    const groups = new Map<number, FocusSession[]>()
    for (const s of [...sessions].sort((a, b) => b.completedAt - a.completedAt)) {
      const day = startOfDay(s.completedAt)
      const list = groups.get(day) ?? []
      list.push(s)
      groups.set(day, list)
    }
    const byDay = [...groups.entries()].map(([day, list]) => ({
      label:
        day === today
          ? 'Today'
          : day === today - DAY_MS
            ? 'Yesterday'
            : new Date(day).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
      sessions: list,
    }))

    const todayAcc = perDay.get(today)
    return {
      todayMinutes: todayAcc?.minutes ?? 0,
      todaySessions: todayAcc?.sessions ?? 0,
      streakDays,
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce((sum, s) => sum + s.durationMin, 0),
      week,
      byDay,
    }
  }, [sessions])
}
