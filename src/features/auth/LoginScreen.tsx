import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Field } from '@/components/ui'
import { signIn, signUp } from '@/lib/auth'

export function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setInfo('Cuenta creada. Si tu proyecto exige confirmar email, revisa tu correo antes de entrar.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-surface-muted p-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-xl font-extrabold text-white">A</div>
          <div>
            <p className="text-lg font-bold leading-tight text-ink">Artesania Manager</p>
            <p className="text-sm text-ink-faint">Gestion de manualidades</p>
          </div>
        </div>

        <div className="mb-6 flex rounded-lg bg-surface-muted p-1">
          <button
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-surface text-primary shadow-card' : 'text-ink-faint'}`}
            onClick={() => setMode('login')}
          >
            Iniciar sesion
          </button>
          <button
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${mode === 'signup' ? 'bg-surface text-primary shadow-card' : 'text-ink-faint'}`}
            onClick={() => setMode('signup')}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>
          <Field label="Contrasena">
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </Field>

          {error && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm font-medium text-accent">{error}</p>}
          {info && <p className="rounded-lg bg-secondary-50 px-3 py-2 text-sm font-medium text-ink">{info}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" size={16} />}
            {mode === 'login' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>
      </div>
    </div>
  )
}
