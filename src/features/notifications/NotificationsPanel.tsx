import { Link } from 'react-router-dom'
import { AlertTriangle, PackageX, Truck, X, CheckCircle2 } from 'lucide-react'
import { useDb } from '@/lib/store'
import { buildNotifications, type Notification } from '@/lib/notifications'

const sevStyle = {
  critico: 'border-l-accent bg-accent-50',
  alerta: 'border-l-primary bg-primary-50',
  info: 'border-l-secondary bg-secondary-50',
} as const

function iconFor(n: Notification) {
  if (n.categoria === 'entrega') return <Truck size={18} />
  return n.severity === 'critico' ? <PackageX size={18} /> : <AlertTriangle size={18} />
}

export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notifs = useDb((db) => buildNotifications(db))
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-surface p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">Notificaciones</h3>
          <button className="btn-ghost !p-1.5" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {notifs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center text-ink-faint">
            <CheckCircle2 className="mb-2 text-secondary" size={32} />
            <p className="font-semibold text-ink-soft">Todo al dia</p>
            <p className="text-sm">Sin entregas por vencer ni quiebres de stock.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map((n) => {
              const link = n.categoria === 'entrega' ? '/funnel' : '/inventario'
              return (
                <Link
                  key={n.id}
                  to={link}
                  onClick={onClose}
                  className={`block rounded-lg border-l-4 p-3 ${sevStyle[n.severity]}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 text-ink-soft">{iconFor(n)}</div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{n.titulo}</p>
                      <p className="text-xs text-ink-soft">{n.detalle}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
