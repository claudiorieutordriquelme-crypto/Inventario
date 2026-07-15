import { type ReactNode, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Boxes,
  KanbanSquare,
  Users,
  Images,
  MessagesSquare,
  Bell,
  Menu,
  X,
  LogOut,
  Lightbulb,
  CalendarDays,
  HelpCircle,
} from 'lucide-react'
import { useDb, clearCloudSession } from '@/lib/store'
import { buildNotifications } from '@/lib/notifications'
import { NotificationsPanel } from '@/features/notifications/NotificationsPanel'
import { HelpModal } from '@/components/HelpModal'
import { isCloud } from '@/lib/supabase'
import { useSession, signOut } from '@/lib/auth'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inventario', label: 'Inventario', icon: Boxes },
  { to: '/planning', label: 'Planning', icon: Lightbulb },
  { to: '/funnel', label: 'Funnel', icon: KanbanSquare },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/catalogo', label: 'Catalogo', icon: Images },
  { to: '/comunidad', label: 'Comunidad', icon: MessagesSquare },
]

export function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const location = useLocation()
  const { session } = useSession()
  const notifs = useDb((db) => buildNotifications(db))
  const criticos = notifs.filter((n) => n.severity === 'critico').length
  const title = nav.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to) && n.to !== '/'))?.label ?? 'Dashboard'

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-ink text-white transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-extrabold">A</div>
          <div>
            <p className="text-sm font-bold leading-tight">Artesania</p>
            <p className="text-xs text-white/60 leading-tight">Manager</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Cerrar menu">
            <X size={20} />
          </button>
        </div>
        <nav className="mt-2 space-y-1 px-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full px-5 py-4 text-xs text-white/40">
          {isCloud ? 'Nube - multiusuario' : 'Datos locales - listo para nube'}
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Contenido */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-surface-border bg-surface px-4 py-3 lg:px-8">
          <button className="btn-ghost !p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-bold text-ink">{title}</h1>
          <button
            className="btn-ghost ml-auto !p-2"
            onClick={() => setHelpOpen(true)}
            aria-label="Ayuda de esta seccion"
            title="Como funciona esta seccion"
          >
            <HelpCircle size={20} />
          </button>
          <button
            className="btn-ghost relative !p-2"
            onClick={() => setNotifOpen(true)}
            aria-label="Notificaciones"
          >
            <Bell size={20} />
            {notifs.length > 0 && (
              <span
                className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                  criticos > 0 ? 'bg-accent' : 'bg-primary'
                }`}
              >
                {notifs.length}
              </span>
            )}
          </button>
          {isCloud && session && (
            <>
              <span className="hidden max-w-[14rem] truncate text-sm text-ink-faint sm:block">
                {session.user.email}
              </span>
              <button
                className="btn-ghost !p-2"
                title="Cerrar sesion"
                onClick={async () => { await signOut(); clearCloudSession() }}
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>

      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <HelpModal open={helpOpen} pathname={location.pathname} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
