import { useState } from 'react'
import { Plus, Clock, TrendingUp, Wallet, ChevronRight } from 'lucide-react'
import { useDb } from '@/lib/store'
import type { Order } from '@/lib/types'
import { SectionTitle, StatTile, Modal, Field, Badge, Card } from '@/components/ui'
import { clp, num, fechaCorta, diasHasta } from '@/lib/format'
import {
  stagesOrdenadas,
  ordersPorEtapa,
  cycleTime,
  tasaConversion,
  pipelineValor,
  moverEtapa,
  addOrder,
  updateOrder,
  deleteOrder,
  montoDeProductos,
} from '@/lib/funnel'

export function FunnelPage() {
  const db = useDb((d) => d)
  const stages = stagesOrdenadas(db)
  const cycle = cycleTime(db)
  const [editing, setEditing] = useState<Order | null>(null)
  const [creating, setCreating] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const maxCount = Math.max(1, ...stages.map((s) => ordersPorEtapa(db, s.id).length))
  const totalQ = db.orders.length
  const totalMonto = db.orders.reduce((s, o) => s + o.monto, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Funnel de ventas" sub="Pipeline por etapas con tiempo de ciclo (cycle time)" />
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> Nuevo pedido
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Cycle time promedio" value={cycle.n ? `${num(cycle.promedioDias)} dias` : 's/d'} hint={cycle.n ? `Mediana ${num(cycle.medianaDias)} d - n=${cycle.n} entregas` : 'Aun sin entregas'} icon={<Clock size={20} />} />
        <StatTile label="Valor pipeline" value={clp(pipelineValor(db))} hint="Pedidos no entregados" icon={<Wallet size={20} />} tone="secondary" />
        <StatTile label="Conversion" value={`${num(tasaConversion(db) * 100)}%`} hint="Entregados / total" icon={<TrendingUp size={20} />} tone="accent" />
      </div>

      {/* Embudo compacto: Q (cantidad) y $ (monto) por etapa */}
      <Card className="!p-4">
        <div className="mb-1 flex items-center gap-3 px-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          <span className="w-4 shrink-0" />
          <span className="w-24 shrink-0 sm:w-28">Etapa</span>
          <span className="hidden flex-1 sm:block" />
          <span className="w-10 shrink-0 text-right">Q</span>
          <span className="w-24 shrink-0 text-right sm:w-28">$</span>
        </div>

        <div className="space-y-0.5">
          {stages.map((s) => {
            const orders = ordersPorEtapa(db, s.id)
            const valor = orders.reduce((sum, o) => sum + o.monto, 0)
            const pct = (orders.length / maxCount) * 100
            const isOpen = expanded === s.id
            return (
              <div key={s.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-muted"
                >
                  <ChevronRight size={16} className={`shrink-0 text-ink-faint transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  <span className="w-24 shrink-0 truncate text-sm font-semibold text-ink sm:w-28">{s.nombre}</span>
                  <span className="hidden h-6 flex-1 overflow-hidden rounded-md bg-surface-muted sm:block">
                    <span
                      className={`block h-full rounded-md ${s.esGanada ? 'bg-secondary' : 'bg-primary'}`}
                      style={{ width: `${orders.length ? Math.max(pct, 8) : 0}%` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right text-sm font-bold text-ink">{orders.length}</span>
                  <span className="w-24 shrink-0 text-right text-sm font-bold text-ink sm:w-28">{clp(valor)}</span>
                </button>

                {isOpen && (
                  <div className="mb-1 ml-7 mt-0.5 space-y-0.5 border-l border-surface-border pl-3">
                    {orders.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-ink-faint">Sin pedidos en esta etapa</p>
                    ) : (
                      orders.map((o) => {
                        const cliente = db.customers.find((c) => c.id === o.customerId)?.nombre ?? 'Cliente'
                        const dias = diasHasta(o.fechaComprometida)
                        const alerta = o.fechaComprometida && !o.entregadoAt && dias !== null && dias <= 2
                        return (
                          <button
                            key={o.id}
                            onClick={() => setEditing(o)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-muted"
                          >
                            <span className="flex-1 truncate text-sm text-ink">
                              {o.titulo} <span className="text-xs text-ink-faint">- {cliente}</span>
                            </span>
                            {o.fechaComprometida && (
                              <Badge tone={alerta ? 'accent' : 'neutral'}>{fechaCorta(o.fechaComprometida)}</Badge>
                            )}
                            <span className="w-24 text-right text-sm font-semibold text-ink">{clp(o.monto)}</span>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Totales */}
        <div className="mt-1 flex items-center gap-3 border-t border-surface-border px-2 pt-2">
          <span className="w-4 shrink-0" />
          <span className="w-24 shrink-0 text-sm font-bold text-ink sm:w-28">Total</span>
          <span className="hidden flex-1 sm:block" />
          <span className="w-10 shrink-0 text-right text-sm font-extrabold text-ink">{totalQ}</span>
          <span className="w-24 shrink-0 text-right text-sm font-extrabold text-ink sm:w-28">{clp(totalMonto)}</span>
        </div>
      </Card>

      {(creating || editing) && (
        <OrderForm order={editing} onClose={() => { setCreating(false); setEditing(null) }} />
      )}
    </div>
  )
}

function OrderForm({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const db = useDb((d) => d)
  const stages = stagesOrdenadas(db)
  const [f, setF] = useState(() =>
    order
      ? { ...order, fechaComprometida: order.fechaComprometida?.slice(0, 10) ?? '' }
      : {
          customerId: db.customers[0]?.id ?? '',
          titulo: '',
          stageId: stages[0]?.id ?? '',
          monto: 0,
          productos: [] as Order['productos'],
          fechaComprometida: '',
          notas: '',
        },
  )
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }))

  // Agrega/actualiza la cantidad de un producto y recalcula el monto sugerido.
  const setProducto = (productId: string, cantidad: number) => {
    setF((s) => {
      const rest = s.productos.filter((l) => l.productId !== productId)
      const productos = cantidad > 0 ? [...rest, { productId, cantidad }] : rest
      return { ...s, productos, monto: montoDeProductos(db, productos) }
    })
  }
  const cantidadDe = (productId: string): number =>
    f.productos.find((l) => l.productId === productId)?.cantidad ?? 0

  const guardar = () => {
    const fechaIso = f.fechaComprometida ? new Date(f.fechaComprometida).toISOString() : null
    if (order) {
      // si cambio la etapa, usar moverEtapa para registrar historial y rebaja
      if (f.stageId !== order.stageId) moverEtapa(order.id, f.stageId)
      updateOrder(order.id, {
        customerId: f.customerId, titulo: f.titulo, monto: f.monto,
        productos: f.productos, fechaComprometida: fechaIso, notas: f.notas,
      })
    } else {
      addOrder({
        customerId: f.customerId, titulo: f.titulo, stageId: f.stageId, monto: f.monto,
        productos: f.productos, fechaComprometida: fechaIso, notas: f.notas,
      })
    }
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={order ? 'Editar pedido' : 'Nuevo pedido'}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Titulo del pedido">
            <input className="input" value={f.titulo} onChange={(e) => set('titulo', e.target.value)} />
          </Field>
        </div>
        <Field label="Cliente">
          <select className="input" value={f.customerId} onChange={(e) => set('customerId', e.target.value)}>
            {db.customers.length === 0 && <option value="">Sin clientes</option>}
            {db.customers.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </Field>
        <Field label="Etapa">
          <select className="input" value={f.stageId} onChange={(e) => set('stageId', e.target.value)}>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </Field>
        <Field label="Monto (CLP)">
          <input type="number" className="input" value={f.monto} onChange={(e) => set('monto', Number(e.target.value))} />
        </Field>
        <Field label="Fecha comprometida">
          <input type="date" className="input" value={f.fechaComprometida} onChange={(e) => set('fechaComprometida', e.target.value)} />
        </Field>

        <div className="col-span-2">
          <p className="label">Productos del pedido</p>
          <p className="-mt-0.5 mb-2 text-xs text-ink-faint">
            Al mover el pedido a "{stages.find((s) => s.esGanada)?.nombre ?? 'Entregado'}" se rebaja el stock automaticamente.
          </p>
          {db.products.length === 0 ? (
            <p className="text-sm text-ink-faint">Primero crea productos en Inventario.</p>
          ) : (
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-surface-border p-3">
              {db.products.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-ink-soft">
                    {p.nombre} <span className="text-xs text-ink-faint">- {clp(p.precio)} (stock {p.stock})</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="input w-24"
                    value={cantidadDe(p.id)}
                    onChange={(e) => setProducto(p.id, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2">
          <Field label="Notas">
            <textarea className="input" rows={2} value={f.notas} onChange={(e) => set('notas', e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between">
        {order ? (
          <button
            className="btn-ghost text-accent"
            onClick={() => { if (confirm('Eliminar pedido?')) { deleteOrder(order.id); onClose() } }}
          >
            Eliminar
          </button>
        ) : <span />}
        <div className="flex gap-2">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={!f.titulo.trim() || !f.customerId} onClick={guardar}>Guardar</button>
        </div>
      </div>
    </Modal>
  )
}
