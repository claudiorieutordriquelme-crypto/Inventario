import type { Customer, Database, Order, Stage } from './types'
import { setState, uid, nowIso } from './store'
import { diasEntre } from './format'

// -------------------------------------------------------------------------
// Marco comercial: pipeline por etapas + Cycle Time (lean).
// cycle_time = entregadoAt - createdAt. Se reporta promedio Y mediana + n,
// porque con bajo volumen el promedio es ruidoso y puede sobre-interpretarse.
// -------------------------------------------------------------------------

export function stagesOrdenadas(db: Database): Stage[] {
  return [...db.stages].sort((a, b) => a.orden - b.orden)
}

export function ordersPorEtapa(db: Database, stageId: string): Order[] {
  return db.orders.filter((o) => o.stageId === stageId)
}

function mediana(nums: number[]): number {
  if (nums.length === 0) return 0
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export interface CycleMetrics {
  n: number
  promedioDias: number
  medianaDias: number
}

// Cycle time de pedidos entregados (created -> entregado).
export function cycleTime(db: Database): CycleMetrics {
  const entregados = db.orders.filter((o) => o.entregadoAt)
  const dias = entregados.map((o) => diasEntre(o.createdAt, o.entregadoAt as string))
  const n = dias.length
  return {
    n,
    promedioDias: n ? dias.reduce((s, d) => s + d, 0) / n : 0,
    medianaDias: mediana(dias),
  }
}

// Tasa de conversion: pedidos en etapa ganada / total.
export function tasaConversion(db: Database): number {
  const ganadaIds = new Set(db.stages.filter((s) => s.esGanada).map((s) => s.id))
  if (db.orders.length === 0) return 0
  const ganados = db.orders.filter((o) => ganadaIds.has(o.stageId)).length
  return ganados / db.orders.length
}

export function pipelineValor(db: Database): number {
  const ganadaIds = new Set(db.stages.filter((s) => s.esGanada).map((s) => s.id))
  return db.orders
    .filter((o) => !ganadaIds.has(o.stageId))
    .reduce((s, o) => s + o.monto, 0)
}

export interface VentaMes {
  key: string
  label: string
  total: number
  cantidad: number
}

// Consolida ventas por mes usando pedidos entregados (entregadoAt).
export function ventasPorMes(db: Database, meses = 6): VentaMes[] {
  const now = new Date()
  const buckets: VentaMes[] = []
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = new Intl.DateTimeFormat('es-CL', { month: 'short' }).format(d)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label, total: 0, cantidad: 0 })
  }
  for (const o of db.orders) {
    if (!o.entregadoAt) continue
    const d = new Date(o.entregadoAt)
    const b = buckets.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`)
    if (b) {
      b.total += o.monto
      b.cantidad += 1
    }
  }
  return buckets
}

// Calcula el monto de un pedido a partir de sus productos y precios actuales.
export function montoDeProductos(
  db: Database,
  productos: Order['productos'],
): number {
  return productos.reduce((sum, line) => {
    const p = db.products.find((x) => x.id === line.productId)
    return sum + (p ? p.precio * line.cantidad : 0)
  }, 0)
}

// --- Mutaciones ---

export function addCustomer(input: Omit<Customer, 'id' | 'createdAt'>) {
  setState((db) => ({
    ...db,
    customers: [...db.customers, { ...input, id: uid('cus'), createdAt: nowIso() }],
  }))
}

export function updateCustomer(id: string, patch: Partial<Customer>) {
  setState((db) => ({
    ...db,
    customers: db.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  }))
}

export function deleteCustomer(id: string) {
  setState((db) => ({
    ...db,
    customers: db.customers.filter((c) => c.id !== id),
    orders: db.orders.filter((o) => o.customerId !== id),
  }))
}

export function addOrder(
  input: Omit<Order, 'id' | 'createdAt' | 'historial' | 'entregadoAt'>,
) {
  setState((db) => {
    const at = nowIso()
    return {
      ...db,
      orders: [
        ...db.orders,
        {
          ...input,
          id: uid('ord'),
          createdAt: at,
          entregadoAt: null,
          historial: [{ stageId: input.stageId, at }],
        },
      ],
    }
  })
}

export function updateOrder(id: string, patch: Partial<Order>) {
  setState((db) => ({
    ...db,
    orders: db.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
  }))
}

export function deleteOrder(id: string) {
  setState((db) => ({ ...db, orders: db.orders.filter((o) => o.id !== id) }))
}

// Mueve un pedido a otra etapa. Al entrar por primera vez a la etapa ganada:
// setea entregadoAt Y rebaja el inventario de los productos vendidos (relacion
// lead -> producto -> inventario), dejando el movimiento en el kardex.
export function moverEtapa(orderId: string, stageId: string) {
  setState((db) => {
    const esGanada = db.stages.find((s) => s.id === stageId)?.esGanada ?? false
    const order = db.orders.find((o) => o.id === orderId)
    if (!order || order.stageId === stageId) return db

    const at = nowIso()
    const primeraVenta = esGanada && !order.entregadoAt && order.productos.length > 0

    let products = db.products
    let movements = db.movements
    if (primeraVenta) {
      const movs: Database['movements'] = []
      products = db.products.map((p) => {
        const line = order.productos.find((l) => l.productId === p.id)
        if (!line) return p
        movs.push({
          id: uid('mov'), fecha: at, tipo: 'venta', itemKind: 'product',
          itemId: p.id, cantidad: -line.cantidad,
          motivo: `Venta pedido: ${order.titulo}`, usuario: 'admin',
        })
        return { ...p, stock: Math.max(0, p.stock - line.cantidad) }
      })
      movements = [...movs, ...db.movements]
    }

    return {
      ...db,
      products,
      movements,
      orders: db.orders.map((o) =>
        o.id !== orderId
          ? o
          : {
              ...o,
              stageId,
              entregadoAt: esGanada ? o.entregadoAt ?? at : o.entregadoAt,
              historial: [...o.historial, { stageId, at }],
            },
      ),
    }
  })
}
