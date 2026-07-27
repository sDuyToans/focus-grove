import { Component, type ErrorInfo, type ReactNode } from 'react'
import '../styles/views.css'

/**
 * AppErrorBoundary — catches render errors anywhere in the tree and
 * shows a cozy apology instead of a blank page, with a reload button.
 */

interface State {
  hasError: boolean
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // a real app would report this somewhere; keep the console useful
    console.error('Focus Grove crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="boundary">
        <div className="boundary-card card" role="alert">
          <span className="boundary-emoji" aria-hidden="true">
            🍂
          </span>
          <h1>Oh no, a tangle in the vines</h1>
          <p>
            Something went wrong on our side — your focus history is safe. A quick refresh usually
            clears it up.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => window.location.reload()}>
            Reload Focus Grove
          </button>
        </div>
      </div>
    )
  }
}
