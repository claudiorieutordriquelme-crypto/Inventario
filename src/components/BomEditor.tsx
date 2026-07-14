import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { BomItem, Material } from '@/lib/types'
import { clp } from '@/lib/format'
import { materialesFaltantes } from '@/lib/inventory'

// Editor de receta (BOM) reutilizable por productos e ideas.
// - Mantiene el texto tal cual se escribe (permite decimales como 0.05 o "2,")
//   usando un draft por fila; recien parsea a numero para el bom.
// - No elimina la linea mientras se edita (0/ vacio simplemente no aporta).
// - Advierte si la receta referencia un insumo que ya no existe (costo/margen
//   quedarian subestimados).
export function BomEditor({
  materials,
  bom,
  onChange,
}: {
  materials: Material[]
  bom: BomItem[]
  onChange: (bom: BomItem[]) => void
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(bom.map((b) => [b.materialId, String(b.cantidad)])),
  )

  const setQty = (id: string, raw: string) => {
    setDraft((d) => ({ ...d, [id]: raw }))
    const n = parseFloat(raw.replace(',', '.'))
    const rest = bom.filter((b) => b.materialId !== id)
    onChange(Number.isFinite(n) && n > 0 ? [...rest, { materialId: id, cantidad: n }] : rest)
  }

  const faltantes = materialesFaltantes(materials, bom)

  if (materials.length === 0) {
    return <p className="text-sm text-ink-faint">Primero registra insumos en la pestana Insumos.</p>
  }

  return (
    <div className="rounded-lg border border-surface-border">
      <div className="flex items-center gap-3 border-b border-surface-border bg-surface-muted px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        <span className="flex-1">Insumo</span>
        <span className="w-24 text-right">Cantidad</span>
        <span className="w-24 text-right">Costo linea</span>
      </div>
      <div className="max-h-52 space-y-2 overflow-y-auto p-3">
        {materials.map((m) => {
          const val = draft[m.id] ?? ''
          const cant = parseFloat(val.replace(',', '.'))
          const costoLinea = Number.isFinite(cant) && cant > 0 ? cant * m.costoUnitario : 0
          return (
            <div key={m.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-ink-soft">
                {m.nombre}{' '}
                <span className="text-xs text-ink-faint">({m.unidad} - {clp(m.costoUnitario)}/{m.unidad})</span>
              </span>
              <input
                type="text"
                inputMode="decimal"
                className="input w-24 text-right"
                value={val}
                placeholder="0"
                onChange={(e) => setQty(m.id, e.target.value)}
              />
              <span className="w-24 text-right text-sm text-ink">{costoLinea > 0 ? clp(costoLinea) : '-'}</span>
            </div>
          )
        })}
      </div>
      {faltantes.length > 0 && (
        <div className="flex items-start gap-2 border-t border-surface-border bg-accent-50 px-3 py-2 text-xs text-accent">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            La receta referencia {faltantes.length} insumo(s) que ya no existe(n) en Inventario. El costo y el
            margen no son confiables hasta corregirla.
          </span>
        </div>
      )}
    </div>
  )
}
