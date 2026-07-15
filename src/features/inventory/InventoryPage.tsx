import { useState } from 'react'
import { SectionTitle } from '@/components/ui'
import { InventorySummary } from './InventorySummary'
import { MaterialsTab } from './MaterialsTab'
import { ProductsTab } from './ProductsTab'
import { MovementsTab } from './MovementsTab'

type Tab = 'materiales' | 'productos' | 'kardex'

export function InventoryPage() {
  const [tab, setTab] = useState<Tab>('materiales')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'materiales', label: 'Insumos' },
    { id: 'productos', label: 'Productos' },
    { id: 'kardex', label: 'Movimientos' },
  ]

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Inventario"
        sub="Control de insumos y productos terminados con alertas por punto de reorden"
      />

      <InventorySummary />

      <div className="flex gap-1 border-b border-surface-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-faint hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'materiales' && <MaterialsTab />}
      {tab === 'productos' && <ProductsTab />}
      {tab === 'kardex' && <MovementsTab />}
    </div>
  )
}
