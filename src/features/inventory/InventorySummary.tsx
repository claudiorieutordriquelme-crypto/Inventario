import { motion } from 'framer-motion'
import { Wallet, AlertTriangle, Percent } from 'lucide-react'
import { useDb } from '@/lib/store'
import { Card, StatTile } from '@/components/ui'
import { clp } from '@/lib/format'
import { valorInventario, materialesEnAlerta, stockStatus, margenProducto } from '@/lib/inventory'

const MARGEN_OBJETIVO = 0.4 // 40%: bajo este umbral se marca como margen bajo

// Resumen de inventario: KPIs + barra de salud de stock (OK / Bajo / Sin stock).
export function InventorySummary() {
  const db = useDb((d) => d)
  const total = db.materials.length

  const conteo = { ok: 0, bajo: 0, critico: 0 }
  for (const m of db.materials) conteo[stockStatus(m)] += 1

  const margenBajo = db.products.filter(
    (p) => p.bom.length > 0 && margenProducto(db.materials, p.bom, p.precio).margenPct < MARGEN_OBJETIVO,
  ).length

  const seg = (n: number) => (total ? (n / total) * 100 : 0)
  const segmentos = [
    { key: 'ok', label: 'OK', n: conteo.ok, color: 'bg-secondary' },
    { key: 'bajo', label: 'Bajo', n: conteo.bajo, color: 'bg-accent/40' },
    { key: 'critico', label: 'Sin stock', n: conteo.critico, color: 'bg-accent' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Valor inventario" value={clp(valorInventario(db))} hint={`${total} insumos`} icon={<Wallet size={20} />} />
        <StatTile label="Insumos en alerta" value={String(materialesEnAlerta(db).length)} hint={`de ${total} insumos`} icon={<AlertTriangle size={20} />} tone="accent" />
        <StatTile label="Productos margen bajo" value={String(margenBajo)} hint={`< ${MARGEN_OBJETIVO * 100}% de margen`} icon={<Percent size={20} />} tone="secondary" />
      </div>

      {total > 0 && (
        <Card className="!p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Salud de stock de insumos</p>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
            {segmentos.map((s) => (
              <motion.div
                key={s.key}
                className={s.color}
                initial={{ width: 0 }}
                animate={{ width: `${seg(s.n)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            {segmentos.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-ink-soft">
                <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} /> {s.label}: <b className="text-ink">{s.n}</b>
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
