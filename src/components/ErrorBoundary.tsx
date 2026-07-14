import { Component, type ReactNode } from 'react'

// Captura errores de render para que la app no quede en blanco: muestra el
// mensaje en pantalla (util para diagnosticar) y permite recargar.
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('ErrorBoundary capturo:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center bg-surface-muted p-6">
          <div className="card max-w-lg p-6">
            <h2 className="text-lg font-bold text-accent">Ocurrio un error en la app</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Detalle tecnico (comparte este texto para diagnosticar):
            </p>
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-surface-muted p-3 text-xs text-ink">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <button className="btn-primary mt-4" onClick={() => window.location.reload()}>
              Recargar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
