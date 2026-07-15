import { Link } from 'react-router-dom'
import { Clock, TrendingUp, Wallet, AlertTriangle, Truck, CalendarCheck, Sparkles } from 'lucide-react'
import { useDb } from '@/lib/store'
import { Card, StatTile, SectionTitle, Badge } from '@/components/ui'
import { clp, num, fechaCorta, diasHasta } from '@/lib/format'
import { valorInventario, materialesEnAlerta } from '@/lib/inventory'
import { cycleTime, tasaConversion, pipelineValor, stagesOrdenadas, ordersPorEtapa, ventasPorMes, cumplimientoPlazo } from '@/lib/funnel'
import { entregasPendientes } from '@/lib/notifications'
import { cargarEjemplos } from '@/lib/demo'

export function Dashboard() {
  const db = useDb((d) => d)
  const cycle = cycleTime(db)
  const alertas = materialesEnAlerta(db)
  const entregas = entregasPendientes(db)
    .slice()
    .sort((a, b) => (a.fechaComprometida! < b.fechaComprometida! ? -1 : 1))
  const stages = stagesOrdenadas(db)
  const maxEnEtapa = Math.max(1, ...stages.map((s) => ordersPorEtapa(db, s.id).length))
  const ventas = ventasPorMes(db, 6)
  const maxVenta = Math.max(1, ...ventas.map((v) => v.total))
  const totalVentas = ventas.reduce((s, v) => s + v.total, 0)
  const plazo = cumplimientoPlazo(db)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          title="Resumen del negocio"
          sub="Vision general de inventario, ventas y entregas"
        />
        <button
          className="btn-outline"
          onClick={() => { if (confirm('Cargar un ejemplo en cada seccion (insumo, producto, cliente, pedido, idea, catalogo, comunidad)?')) cargarEjemplos() }}
        >
          <Sparkles size={16} /> Cargar datos de ejemplo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          label="Valor inventario"
          value={clp(valorInventario(db))}
          hint={`${db.materials.length} insumos - ${db.products.length} productos`}
          icon={<Wallet size={22} />}
          tone="primary"
        />
        <StatTile
          label="Pipeline abierto"
          value={clp(pipelineValor(db))}
          hint={`${db.orders.length} pedidos totales`}
          icon={<TrendingUp size={22} />}
          tone="secondary"
        />
        <StatTile
          label="Cycle time"
          value={cycle.n ? `${num(cycle.promedioDias)} d` : 's/d'}
          hint={cycle.n ? `Mediana ${num(cycle.medianaDias)} d - n=${cycle.n}` : 'Sin entregas aun'}
          icon={<Clock size={22} />}
          tone="primary"
        />
        <StatTile
          label="Conversion"
          value={`${num(tasaConversion(db) * 100)}%`}
          hint="Pedidos entregados / total"
          icon={<TrendingUp size={22} />}
          tone="accent"
        />
        <StatTile
          label="Cumplimiento de plazo"
          value={plazo.entregados ? `${num(plazo.tasa * 100)}%` : 's/d'}
          hint={plazo.entregados ? `${plazo.aTiempo}/${plazo.entregados} entregas con plazo a tiempo` : 'Sin entregas con plazo'}
          icon={<CalendarCheck size={22} />}
          tone={plazo.entregados && plazo.tasa < 0.8 ? 'accent' : 'secondary'}
        />
      </div>

      {/* Ventas por mes */}
      <Card>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h3 className="font-bold text-ink">Ventas por mes</h3>
            <p className="text-xs text-ink-faint">Ultimos 6 meses - pedidos entregados</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Total periodo</p>
            <p className="text-xl font-extrabold text-ink">{clp(totalVentas)}</p>
          </div>
        </div>
        <div className="flex h-48 items-end gap-3">
          {ventas.map((v) => {
            const h = (v.total / maxVenta) * 100
            return (
              <div key={v.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-primary transition-all hover:bg-primary-700"
                    style={{ height: `${v.total > 0 ? Math.max(h, 3) : 0}%` }}
                    title={`${clp(v.total)} - ${v.cantidad} venta(s)`}
                  />
                </div>
                <span className="text-xs font-semibold text-ink">{clp(v.total)}</span>
                <span className="text-xs capitalize text-ink-faint">{v.label}</span>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Funnel visual */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink">Funnel de ventas</h3>
            <Link to="/funnel" className="text-sm font-semibold text-primary hover:underline">
              Ver tablero
            </Link>
          </div>
          <div className="space-y-2">
            {stages.map((s) => {
              const cnt = ordersPorEtapa(db, s.id).length
              const pct = (cnt / maxEnEtapa) * 100
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-ink-soft">{s.nombre}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-md bg-surface-muted">
                    <div
                      className={`h-full rounded-md ${s.esGanada ? 'bg-secondary' : 'bg-primary'}`}
                      style={{ width: `${Math.max(pct, cnt ? 8 : 0)}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-sm font-semibold text-ink">{cnt}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Alertas de stock */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink">Alertas de stock</h3>
            <AlertTriangle size={18} className="text-accent" />
          </div>
          {alertas.length === 0 ? (
            <p className="text-sm text-ink-faint">Sin quiebres de stock.</p>
          ) : (
            <div className="space-y-2">
              {alertas.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">{m.nombre}</p>
                    <p className="text-xs text-ink-faint">
                      {m.stockActual}/{m.stockMinimo} {m.unidad}
                    </p>
                  </div>
                  <Badge tone={m.stockActual <= 0 ? 'accent' : 'neutral'}>
                    {m.stockActual <= 0 ? 'Sin stock' : 'Bajo'}
                  </Badge>
                </div>
              ))}
              <Link to="/inventario" className="block pt-1 text-sm font-semibold text-primary hover:underline">
                Ir a inventario
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Proximas entregas */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-ink">Proximas entregas</h3>
          <Truck size={18} className="text-primary" />
        </div>
        {entregas.length === 0 ? (
          <p className="text-sm text-ink-faint">No hay entregas comprometidas pendientes.</p>
        ) : (
          <div className="divide-y divide-surface-border">
            {entregas.slice(0, 6).map((o) => {
              const dias = diasHasta(o.fechaComprometida)
              const cliente = db.customers.find((c) => c.id === o.customerId)?.nombre ?? 'Cliente'
              const vencido = (dias ?? 0) < 0
              return (
                <div key={o.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-ink">{o.titulo}</p>
                    <p className="text-xs text-ink-faint">{cliente}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{fechaCorta(o.fechaComprometida)}</p>
                    <Badge tone={vencido ? 'accent' : dias === 0 ? 'accent' : 'primary'}>
                      {vencido ? `${Math.abs(dias!)}d vencido` : dias === 0 ? 'Hoy' : `en ${dias}d`}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
