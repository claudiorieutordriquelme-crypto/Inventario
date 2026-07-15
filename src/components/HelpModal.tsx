import { CheckCircle2, Lightbulb } from 'lucide-react'
import { Modal } from './ui'
import { helpSections, helpFallback } from '@/lib/help'

// Muestra la ayuda de la seccion actual (segun la ruta).
export function HelpModal({
  open,
  pathname,
  onClose,
}: {
  open: boolean
  pathname: string
  onClose: () => void
}) {
  const help = helpSections[pathname] ?? helpFallback

  return (
    <Modal open={open} onClose={onClose} title={`Ayuda: ${help.titulo}`}>
      <div className="space-y-5">
        <div>
          <p className="label">Que hace</p>
          <p className="text-sm text-ink-soft">{help.queHace}</p>
        </div>

        <div>
          <p className="label">Como se usa</p>
          <ol className="space-y-2">
            {help.pasos.map((paso, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-soft">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span>{paso}</span>
              </li>
            ))}
          </ol>
        </div>

        {help.tips && help.tips.length > 0 && (
          <div className="rounded-lg border-l-4 border-l-secondary bg-secondary-50 p-3">
            {help.tips.map((tip, i) => (
              <p key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-ink" /> {tip}
              </p>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-surface-border pt-3 text-xs text-ink-faint">
          <CheckCircle2 size={14} className="text-secondary" />
          La ayuda cambia segun la seccion en la que estes.
        </div>
      </div>
    </Modal>
  )
}
