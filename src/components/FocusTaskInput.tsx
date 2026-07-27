import { Check, Pencil, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useFocusTask } from '../hooks/useSessions'
import '../styles/views.css'

/**
 * FocusTaskInput — the intention field above the timers ("What are you
 * focusing on?"). The task persists per user and gets attached to every
 * session completed while it's set. Displays as calm text during a
 * session with a small edit affordance.
 */

interface Props {
  /** While the timer runs the field turns into a quiet banner. */
  active?: boolean
}

export function FocusTaskInput({ active = false }: Props) {
  const [task, setTask] = useFocusTask()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commit = () => {
    setTask(draft.trim())
    setEditing(false)
  }

  if (editing || (!task && !active)) {
    return (
      <form
        className="task-input"
        onSubmit={(e) => {
          e.preventDefault()
          commit()
        }}
      >
        <input
          ref={inputRef}
          value={editing ? draft : task}
          onChange={(e) => {
            setDraft(e.target.value)
            if (!editing) setEditing(true)
          }}
          onFocus={() => {
            setDraft(task)
            setEditing(true)
          }}
          placeholder="What are you focusing on?"
          maxLength={80}
          aria-label="Focus intention"
        />
        {editing && (
          <div className="task-input-actions">
            <button type="submit" className="btn btn-icon" aria-label="Save focus intention">
              <Check size={18} />
            </button>
            <button
              type="button"
              className="btn btn-icon"
              aria-label="Cancel editing"
              onClick={() => {
                setDraft(task)
                setEditing(false)
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}
      </form>
    )
  }

  return (
    <div className={`task-banner ${active ? 'task-banner-active' : ''}`}>
      <span className="task-banner-label">{active ? 'Focusing on' : 'Up next'}</span>
      <span className="task-banner-text">{task || 'a mindful session'}</span>
      <button
        className="btn btn-icon task-banner-edit"
        aria-label="Edit focus intention"
        onClick={() => {
          setDraft(task)
          setEditing(true)
        }}
      >
        <Pencil size={16} />
      </button>
      {task && (
        <button
          className="btn btn-icon task-banner-edit"
          aria-label="Clear focus intention"
          onClick={() => setTask('')}
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
