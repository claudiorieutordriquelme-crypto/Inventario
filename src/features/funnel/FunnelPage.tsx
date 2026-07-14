import { useState } from 'react'
import { Plus, Clock, TrendingUp, Wallet } from 'lucide-react'
import { useDb } from '@/lib/store'
import type { Order } from '@/lib/types'
import { SectionTitle, StatTile, Modal, Field, Badge } from '@/components/ui'
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

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((s) => {
          const orders = ordersPorEtapa(db, s.id)
          const valor = orders.reduce((sum, o) => sum + o.monto, 0)
          return (
            <div key={s.id} className="flex w-72 shrink-0 flex-col">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${s.esGanada ? 'bg-secondary' : 'bg-primary'}`} />
                  <span className="text-sm font-bold text-ink">{s.nombre}</span>
                  <Badge tone="neutral">{orders.length}</Badge>
                </div>
              </div>
              <p className="mb-2 px-1 text-xs text-ink-faint">{clp(valor)}</p>
              <div className="flex flex-1 flex-col gap-2 rounded-xl bg-surface-muted p-2">
                {orders.length === 0 && (
                  <p className="px-2 py-4 text-center text-xs text-ink-faint">Sin pedidos</p>
                )}
                {orders.map((o) => (
                  <OrderCard key={o.id} order={o} onClick={() => setEditing(o)} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {(creating || editing) && (
        <OrderForm order={editing} onClose={() => { setCreating(false); setEditing(null) }} />
      )}
    </div>
  )
}

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const db = useDb((d) => d)
  const cliente = db.customers.find((c) => c.id === order.customerId)?.nombre ?? 'Cliente'
  const dias = diasHasta(order.fechaComprometida)
  const alerta = order.fechaComprometida && !order.entregadoAt && dias !== null && dias <= 2

  return (
    <button onClick={onClick} className="card w-full p-3 text-left hover:border-primary">
      <p className="text-sm font-semibold text-ink">{order.titulo}</p>
      <p className="text-xs text-ink-faint">{cliente}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-ink">{clp(order.monto)}</span>
        {order.fechaComprometida && (
          <Badge tone={alerta ? 'accent' : 'neutral'}>
            {fechaCorta(order.fechaComprometida)}
          </Badge>
        )}
      </div>
    </button>
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
