import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

// Primitivas de UI con tema Entel. Se mantienen simples para facilitar la
// mantencion (sin dependencias de librerias de componentes).

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {sub && <p className="text-sm text-ink-faint mt-0.5">{sub}</p>}
    </div>
  )
}

type BadgeTone = 'primary' | 'accent' | 'secondary' | 'neutral'
const badgeTones: Record<BadgeTone, string> = {
  primary: 'bg-primary-50 text-primary-700',
  accent: 'bg-accent-50 text-accent',
  secondary: 'bg-secondary-50 text-ink',
  neutral: 'bg-surface-muted text-ink-soft',
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTones[tone]}`}
    >
      {children}
    </span>
  )
}

export function StatTile({
  label,
  value,
  hint,
  tone = 'primary',
  icon,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'primary' | 'accent' | 'secondary'
  icon?: ReactNode
}) {
  const bar =
    tone === 'accent' ? 'bg-accent' : tone === 'secondary' ? 'bg-secondary' : 'bg-primary'
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute left-0 top-0 h-full w-1 ${bar}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
        </div>
        {icon && <div className="text-ink-faint">{icon}</div>}
      </div>
    </Card>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 sm:p-8">
      <div
        className={`card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button className="btn-ghost !p-1.5" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border py-12 text-center">
      <p className="font-semibold text-ink-soft">{title}</p>
      {hint && <p className="mt-1 text-sm text-ink-faint">{hint}</p>}
    </div>
  )
}
