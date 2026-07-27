import { AnimalCompanion } from './AnimalCompanion'
import type { CompanionMood } from '../types'
import '../styles/views.css'

/**
 * CompanionStatus — Maple in a card with a one-line status caption that
 * matches her mood. Shared by the Pomodoro and Timer views.
 */

const CAPTIONS: Record<CompanionMood, string> = {
  idle: 'Maple is ready when you are.',
  focus: 'Maple is focusing right beside you.',
  sleep: 'Maple is napping through the break…',
  stretch: 'Maple is having a lovely long stretch.',
  celebrate: 'Maple is doing a happy dance!',
  sad: 'Maple gets it — some sessions just aren\u2019t the one.',
}

interface Props {
  mood: CompanionMood
  /** Override the default caption for the mood. */
  caption?: string
  size?: number
}

export function CompanionStatus({ mood, caption, size = 150 }: Props) {
  return (
    <div className="pomo-companion card">
      <AnimalCompanion mood={mood} size={size} />
      <p className="pomo-companion-note">{caption ?? CAPTIONS[mood]}</p>
    </div>
  )
}
