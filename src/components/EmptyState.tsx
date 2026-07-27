import type { ReactNode } from 'react'
import '../styles/views.css'

/**
 * EmptyState — a friendly "nothing here yet" block with an emoji
 * illustration, used by history and stats before the first session.
 */

interface Props {
  emoji: string
  title: string
  children: ReactNode
}

export function EmptyState({ emoji, title, children }: Props) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state-emoji" aria-hidden="true">
        {emoji}
      </span>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-body">{children}</p>
    </div>
  )
}
