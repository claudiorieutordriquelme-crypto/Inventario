import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VentaMes } from '@/lib/funnel'
import { clp } from '@/lib/format'
import { EmptyState } from '@/components/ui'

// Grafico de ventas por mes: barras animadas, linea de promedio y tooltip propio.
// Una sola serie (ventas entregadas), color de marca primary; mes top en secondary.
export function SalesBarChart({ ventas }: { ventas: VentaMes[] }) {
  const [hover, setHover] = useState<number | null>(null)

  const maxVenta = Math.max(1, ...ventas.map((v) => v.total))
  const totalVentas = ventas.reduce((s, v) => s + v.total, 0)
  const conVenta = ventas.filter((v) => v.total > 0)
  const promedio = conVenta.length ? totalVentas / conVenta.length : 0
  const topIdx = ventas.reduce((best, v, i) => (v.total > ventas[best].total ? i : best), 0)

  if (totalVentas === 0) {
    return (
      <EmptyState
        title="Aun no hay ventas entregadas"
        hint="Se registran al mover un pedido a la etapa Entregado"
      />
    )
  }

  return (
    <div className="relative h-52 select-none">
      {/* Linea de promedio */}
      {promedio > 0 && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-ink-faint/50"
          style={{ bottom: `calc(1.5rem + ${(promedio / maxVenta) * 100 * 0.78}%)` }}
        >
          <span className="absolute -top-4 right-0 text-[10px] font-semibold text-ink-faint">
            Prom. {clp(promedio)}
          </span>
        </div>
      )}

      {/* Baseline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 border-t border-surface-border" />

      <div className="flex h-full items-end gap-2 pb-6">
        {ventas.map((v, i) => {
          const h = (v.total / maxVenta) * 100
          return (
            <div
              key={v.key}
              className="relative flex h-full flex-1 items-end justify-center"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((cur) => (cur === i ? null : cur))}
            >
              {/* Tooltip propio */}
              <AnimatePresence>
                {hover === i && v.total > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute bottom-full z-20 mb-1 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-center text-white shadow-card"
                  >
                    <p className="text-xs font-bold">{clp(v.total)}</p>
                    <p className="text-[10px] text-white/70">{v.cantidad} venta(s)</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="button"
                tabIndex={0}
                aria-label={`${v.label}: ${clp(v.total)}, ${v.cantidad} ventas`}
                onFocus={() => setHover(i)}
                onBlur={() => setHover((cur) => (cur === i ? null : cur))}
                initial={{ height: 0 }}
                animate={{ height: `${v.total > 0 ? Math.max(h, 3) : 0}%` }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
                className={`w-full max-w-[3rem] rounded-t-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-100 ${
                  i === topIdx ? 'bg-secondary' : 'bg-primary hover:bg-primary-700'
                }`}
              />
            </div>
          )
        })}
      </div>

      {/* Etiquetas de mes */}
      <div className="absolute inset-x-0 bottom-0 flex gap-2">
        {ventas.map((v) => (
          <span key={v.key} className="flex-1 text-center text-xs capitalize text-ink-faint">
            {v.label}
          </span>
        ))}
      </div>
    </div>
  )
}
