import { useDb } from '@/lib/store'
import { Card, Badge, EmptyState } from '@/components/ui'
import { fecha } from '@/lib/format'
import type { MovementType } from '@/lib/types'

const tipoTone: Record<MovementType, 'primary' | 'accent' | 'secondary' | 'neutral'> = {
  entrada: 'secondary',
  venta: 'primary',
  produccion: 'primary',
  salida: 'accent',
  ajuste: 'neutral',
}

export function MovementsTab() {
  const db = useDb((d) => d)
  const { movements, materials, products } = db

  const nombreItem = (kind: 'material' | 'product', id: string) =>
    kind === 'material'
      ? materials.find((m) => m.id === id)?.nombre ?? 'Insumo eliminado'
      : products.find((p) => p.id === id)?.nombre ?? 'Producto eliminado'

  if (movements.length === 0) {
    return <EmptyState title="Sin movimientos" hint="Los ajustes de stock y producciones apareceran aqui (kardex)." />
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {movements.map((mv) => (
              <tr key={mv.id} className="hover:bg-surface-muted/50">
                <td className="px-4 py-3 text-ink-soft">{fecha(mv.fecha)}</td>
                <td className="px-4 py-3 font-medium text-ink">{nombreItem(mv.itemKind, mv.itemId)}</td>
                <td className="px-4 py-3"><Badge tone={tipoTone[mv.tipo]}>{mv.tipo}</Badge></td>
                <td className={`px-4 py-3 text-right font-semibold ${mv.cantidad < 0 ? 'text-accent' : 'text-ink'}`}>
                  {mv.cantidad > 0 ? '+' : ''}{mv.cantidad}
                </td>
                <td className="px-4 py-3 text-ink-faint">{mv.motivo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
