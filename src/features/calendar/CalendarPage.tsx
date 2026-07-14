import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDb } from '@/lib/store'
import type { Order } from '@/lib/types'
import { SectionTitle, Card, Badge } from '@/components/ui'
import { clp } from '@/lib/format'

const DIAS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

export function CalendarPage() {
  const db = useDb((d) => d)
  const navigate = useNavigate()
  const hoy = new Date()
  const [cursor, setCursor] = useState({ y: hoy.getFullYear(), m: hoy.getMonth() })

  // Pedidos con fecha de entrega comprometida, agrupados por dia del mes visible.
  const porDia = useMemo(() => {
    const map = new Map<number, Order[]>()
    for (const o of db.orders) {
      if (!o.fechaComprometida) continue
      const d = new Date(o.fechaComprometida)
      if (d.getFullYear() === cursor.y && d.getMonth() === cursor.m) {
        const day = d.getDate()
        map.set(day, [...(map.get(day) ?? []), o])
      }
    }
    return map
  }, [db.orders, cursor])

  const primerDia = new Date(cursor.y, cursor.m, 1)
  const offset = (primerDia.getDay() + 6) % 7 // lunes = 0
  const diasEnMes = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const celdas: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ]
  while (celdas.length % 7 !== 0) celdas.push(null)

  const nombreMes = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(primerDia)
  const esHoy = (day: number) =>
    day === hoy.getDate() && cursor.m === hoy.getMonth() && cursor.y === hoy.getFullYear()

  const mover = (delta: number) => {
    setCursor((c) => {
      const nm = c.m + delta
      return { y: c.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 }
    })
  }

  const totalMes = [...porDia.values()].flat().reduce((s, o) => s + o.monto, 0)

  return (
    <div className="space-y-6">
      <SectionTitle title="Calendario de entregas" sub="Pedidos por fecha comprometida de entrega" />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="btn-ghost !p-1.5" onClick={() => mover(-1)} aria-label="Mes anterior"><ChevronLeft size={18} /></button>
            <h3 className="w-48 text-center font-bold capitalize text-ink">{nombreMes}</h3>
            <button className="btn-ghost !p-1.5" onClick={() => mover(1)} aria-label="Mes siguiente"><ChevronRight size={18} /></button>
            <button className="btn-outline ml-2 !py-1 text-xs" onClick={() => setCursor({ y: hoy.getFullYear(), m: hoy.getMonth() })}>Hoy</button>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Comprometido el mes</p>
            <p className="text-lg font-extrabold text-ink">{clp(totalMes)}</p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DIAS.map((d) => (
            <div key={d} className="pb-1 text-center text-xs font-semibold uppercase tracking-wide text-ink-faint">{d}</div>
          ))}
          {celdas.map((day, i) => {
            if (day === null) return <div key={i} className="min-h-24 rounded-lg bg-surface-muted/40" />
            const orders = porDia.get(day) ?? []
            return (
              <div key={i} className={`min-h-24 rounded-lg border p-1.5 ${esHoy(day) ? 'border-primary bg-primary-50' : 'border-surface-border bg-surface'}`}>
                <div className={`mb-1 text-xs font-bold ${esHoy(day) ? 'text-primary' : 'text-ink-soft'}`}>{day}</div>
                <div className="space-y-1">
                  {orders.map((o) => {
                    const cliente = db.customers.find((c) => c.id === o.customerId)?.nombre ?? ''
                    const vencido = !o.entregadoAt && new Date(o.fechaComprometida as string) < hoy && !esHoy(day)
                    const tone = o.entregadoAt ? 'secondary' : vencido ? 'accent' : 'primary'
                    return (
                      <button
                        key={o.id}
                        onClick={() => navigate('/funnel')}
                        className="block w-full rounded-md bg-surface-muted px-1.5 py-1 text-left transition-colors hover:bg-primary-50"
                        title={`${o.titulo} - ${cliente} - ${clp(o.monto)}`}
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
      </Card>
    </div>
  )
}
