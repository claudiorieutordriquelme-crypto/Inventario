import { motion } from 'framer-motion'
import { Lightbulb, TrendingUp, Package, Percent } from 'lucide-react'
import { useDb } from '@/lib/store'
import { StatTile } from '@/components/ui'
import { clp } from '@/lib/format'
import { costoProducto } from '@/lib/inventory'

// Resumen del pipeline de manufactura (ideas aun no convertidas a producto).
export function PlanningSummary() {
  const db = useDb((d) => d)
  const activas = db.ideas.filter((i) => i.stage !== 'listo')

  const valorPotencial = activas.reduce((s, i) => s + (i.precioEstimado ?? 0), 0)
  const costoInsumos = activas.reduce((s, i) => s + costoProducto(db.materials, i.bom ?? []), 0)
  const margenPotencial = valorPotencial - costoInsumos

  return (
    <motion.div
      className="grid grid-cols-2 gap-4 md:grid-cols-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <StatTile label="Ideas activas" value={String(activas.length)} hint="En desarrollo" icon={<Lightbulb size={20} />} />
      <StatTile label="Valor potencial" value={clp(valorPotencial)} hint="Suma estimada" icon={<TrendingUp size={20} />} tone="secondary" />
      <StatTile label="Costo insumos" value={clp(costoInsumos)} hint="Segun recetas" icon={<Package size={20} />} />
      <StatTile
        label="Margen potencial"
        value={valorPotencial > 0 ? clp(margenPotencial) : '-'}
        hint="Valor - costo"
        icon={<Percent size={20} />}
        tone={margenPotencial < 0 ? 'accent' : 'secondary'}
      />
    </motion.div>
  )
}
