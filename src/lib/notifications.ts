import type { Database, Order } from './types'
import { diasHasta } from './format'
import { materialesEnAlerta } from './inventory'

// Notificaciones in-app (MVP). En la nube esto se complementa con email
// (Supabase Edge Function) y push movil (FCM via Capacitor).

export type NotifSeverity = 'critico' | 'alerta' | 'info'

export interface Notification {
  id: string
  severity: NotifSeverity
  titulo: string
  detalle: string
  categoria: 'entrega' | 'inventario'
  refId: string
}

// Umbral: alertar entregas comprometidas dentro de los proximos 2 dias
// o ya vencidas. Configurable a futuro por el negocio.
const DIAS_ALERTA_ENTREGA = 2

function esGanada(db: Database, stageId: string): boolean {
  return db.stages.find((s) => s.id === stageId)?.esGanada ?? false
}

export function entregasPendientes(db: Database): Order[] {
  return db.orders.filter(
    (o) => o.fechaComprometida && !o.entregadoAt && !esGanada(db, o.stageId),
  )
}

export function buildNotifications(db: Database): Notification[] {
  const notifs: Notification[] = []

  // Entregas proximas / vencidas
  for (const o of entregasPendientes(db)) {
    const dias = diasHasta(o.fechaComprometida)
    if (dias === null) continue
    if (dias < 0) {
      notifs.push({
        id: `ent-${o.id}`, severity: 'critico', categoria: 'entrega', refId: o.id,
        titulo: `Entrega vencida: ${o.titulo}`,
        detalle: `Comprometida hace ${Math.abs(dias)} dia(s). Requiere accion inmediata.`,
      })
    } else if (dias <= DIAS_ALERTA_ENTREGA) {
      notifs.push({
        id: `ent-${o.id}`, severity: 'alerta', categoria: 'entrega', refId: o.id,
        titulo: `Entrega proxima: ${o.titulo}`,
        detalle: dias === 0 ? 'Se entrega hoy.' : `Faltan ${dias} dia(s).`,
      })
    }
  }

  // Inventario bajo / critico
  for (const m of materialesEnAlerta(db)) {
    const critico = m.stockActual <= 0
    notifs.push({
      id: `inv-${m.id}`,
      severity: critico ? 'critico' : 'alerta',
      categoria: 'inventario',
      refId: m.id,
      titulo: critico ? `Sin stock: ${m.nombre}` : `Stock bajo: ${m.nombre}`,
      detalle: `Actual ${m.stockActual} / minimo ${m.stockMinimo} ${m.unidad}. Lead time ${m.leadTimeDias} dias.`,
    })
  }

  const rank: Record<NotifSeverity, number> = { critico: 0, alerta: 1, info: 2 }
  return notifs.sort((a, b) => rank[a.severity] - rank[b.severity])
}
