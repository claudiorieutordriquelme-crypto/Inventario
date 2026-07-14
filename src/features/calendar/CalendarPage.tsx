import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useDb } from '@/lib/store'
import type { Database, Order } from '@/lib/types'
import { SectionTitle, Card, Badge } from '@/components/ui'
import { clp } from '@/lib/format'
import { OrderForm } from '@/features/funnel/FunnelPage'

const DIAS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

type FormState = { order: Order | null; fecha?: string }

export function CalendarPage() {
  const db = useDb((d) => d)
  const hoy = new Date()
  const [cursor, setCursor] = useState({ y: hoy.getFullYear(), m: hoy.getMonth() })
  const [modo, setModo] = useState<'mes' | 'anio'>('mes')
  const [form, setForm] = useState<FormState | null>(null)

  const nombreMes = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(
    new Date(cursor.y, cursor.m, 1),
  )

  const mover = (delta: number) => {
    if (modo === 'anio') {
      setCursor((c) => ({ ...c, y: c.y + delta }))
      return
    }
    setCursor((c) => {
      const nm = c.m + delta
      return { y: c.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Calendario de entregas" sub="Pedidos por fecha comprometida de entrega" />
        <button className="btn-primary" onClick={() => setForm({ order: null })}>
          <Plus size={16} /> Nuevo pedido
        </button>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button className="btn-ghost !p-1.5" onClick={() => mover(-1)} aria-label="Anterior"><ChevronLeft size={18} /></button>
            <h3 className="w-44 text-center font-bold capitalize text-ink">{modo === 'anio' ? cursor.y : nombreMes}</h3>
            <button className="btn-ghost !p-1.5" onClick={() => mover(1)} aria-label="Siguiente"><ChevronRight size={18} /></button>
            <button className="btn-outline ml-2 !py-1 text-xs" onClick={() => { setCursor({ y: hoy.getFullYear(), m: hoy.getMonth() }); setModo('mes') }}>Hoy</button>
          </div>
          <div className="flex rounded-lg bg-surface-muted p-1">
            {(['mes', 'anio'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setModo(v)}
                className={`rounded-md px-3 py-1 text-sm font-semibold capitalize transition-colors ${
                  modo === v ? 'bg-surface text-primary shadow-card' : 'text-ink-faint'
                }`}
              >
                {v === 'mes' ? 'Mes (micro)' : 'Ano (macro)'}
              </button>
            ))}
          </div>
        </div>

        {modo === 'mes' ? (
          <VistaMes
            db={db}
            y={cursor.y}
            m={cursor.m}
            hoy={hoy}
            onAdd={(fecha) => setForm({ order: null, fecha })}
            onEdit={(o) => setForm({ order: o })}
          />
        ) : (
          <VistaAnio
            db={db}
            y={cursor.y}
            onOpenMonth={(m) => { setCursor((c) => ({ ...c, m })); setModo('mes') }}
          />
        )}
      </Card>

      {form && (
        <OrderForm order={form.order} initialFecha={form.fecha} onClose={() => setForm(null)} />
      )}
    </div>
  )
}

function VistaMes({
  db,
  y,
  m,
  hoy,
  onAdd,
  onEdit,
}: {
  db: Database
  y: number
  m: number
  hoy: Date
  onAdd: (fechaIso: string) => void
  onEdit: (o: Order) => void
}) {
  const porDia = useMemo(() => {
    const map = new Map<number, Order[]>()
    for (const o of db.orders as Order[]) {
      if (!o.fechaComprometida) continue
      const d = new Date(o.fechaComprometida)
      if (d.getFullYear() === y && d.getMonth() === m) {
        map.set(d.getDate(), [...(map.get(d.getDate()) ?? []), o])
      }
    }
    return map
  }, [db.orders, y, m])

  const offset = (new Date(y, m, 1).getDay() + 6) % 7
  const diasEnMes = new Date(y, m + 1, 0).getDate()
  const celdas: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ]
  while (celdas.length % 7 !== 0) celdas.push(null)

  const esHoy = (day: number) =>
    day === hoy.getDate() && m === hoy.getMonth() && y === hoy.getFullYear()
  const fechaIso = (day: number) => new Date(y, m, day, 12).toISOString()

  return (
    <div className="grid grid-cols-7 gap-1">
      {DIAS.map((d) => (
        <div key={d} className="pb-1 text-center text-xs font-semibold uppercase tracking-wide text-ink-faint">{d}</div>
      ))}
      {celdas.map((day, i) => {
        if (day === null) return <div key={i} className="min-h-24 rounded-lg bg-surface-muted/40" />
        const orders = porDia.get(day) ?? []
        return (
          <div key={i} className={`group min-h-24 rounded-lg border p-1.5 ${esHoy(day) ? 'border-primary bg-primary-50' : 'border-surface-border bg-surface'}`}>
            <div className="mb-1 flex items-center justify-between">
              <span className={`text-xs font-bold ${esHoy(day) ? 'text-primary' : 'text-ink-soft'}`}>{day}</span>
              <button
                className="text-ink-faint opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                title="Agregar pedido este dia"
                onClick={() => onAdd(fechaIso(day))}
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {orders.map((o) => {
                const vencido = !o.entregadoAt && new Date(o.fechaComprometida as string) < hoy && !esHoy(day)
                const tone = o.entregadoAt ? 'secondary' : vencido ? 'accent' : 'primary'
                return (
                  <button
                    key={o.id}
                    onClick={() => onEdit(o)}
                    className="block w-full rounded-md bg-surface-muted px-1.5 py-1 text-left transition-colors hover:bg-primary-50"
                    title={`${o.titulo} - ${clp(o.monto)}`}
                  >
                    <p className="truncate text-[11px] font-semibold text-ink">{o.titulo}</p>
                    <Badge tone={tone}>{o.entregadoAt ? 'Entregado' : vencido ? 'Vencido' : clp(o.monto)}</Badge>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function VistaAnio({
  db,
  y,
  onOpenMonth,
}: {
  db: Database
  y: number
  onOpenMonth: (m: number) => void
}) {
  // Resumen por mes del ano: cantidad de pedidos y monto comprometido.
  const resumen = useMemo(() => {
    const meses = Array.from({ length: 12 }, () => ({ q: 0, monto: 0 }))
    for (const o of db.orders as Order[]) {
      if (!o.fechaComprometida) continue
      const d = new Date(o.fechaComprometida)
      if (d.getFullYear() === y) {
        meses[d.getMonth()].q += 1
        meses[d.getMonth()].monto += o.monto
      }
    }
    return meses
  }, [db.orders, y])

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {resumen.map((r, m) => {
        const nombre = new Intl.DateTimeFormat('es-CL', { month: 'long' }).format(new Date(y, m, 1))
        return (
          <button
            key={m}
            onClick={() => onOpenMonth(m)}
            className="rounded-xl border border-surface-border bg-surface p-4 text-left transition-colors hover:border-primary"
          >
            <p className="font-bold capitalize text-ink">{nombre}</p>
            <p className="mt-2 text-2xl font-extrabold text-ink">{r.q}</p>
            <p className="text-xs text-ink-faint">pedido(s)</p>
            <p className="mt-2 text-sm font-semibold text-primary">{clp(r.monto)}</p>
          </button>
        )
      })}
    </div>
  )
}
