import { useState } from 'react'
import { Plus, Pencil, Trash2, Factory, Share2 } from 'lucide-react'
import { useDb } from '@/lib/store'
import type { Product, ProductType, BomItem } from '@/lib/types'
import { Card, Badge, Modal, Field, EmptyState } from '@/components/ui'
import { clp } from '@/lib/format'
import { addProduct, updateProduct, deleteProduct, registrarProduccion } from '@/lib/inventory'

const TIPOS: ProductType[] = ['crochet', 'estampado', 'otro']

const empty: Omit<Product, 'id' | 'createdAt'> = {
  nombre: '', tipo: 'crochet', sku: '', precio: 0, stock: 0, fotoUrl: '',
  catalogoPublico: false, bom: [],
}

export function ProductsTab() {
  const products = useDb((db) => db.products)
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [produce, setProduce] = useState<Product | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {products.length === 0 ? (
        <EmptyState title="Sin productos" hint="Crea un producto y define su receta de insumos (BOM)." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="font-bold text-ink">{p.nombre}</p>
                  <p className="text-xs text-ink-faint">{p.sku || 'sin SKU'}</p>
                </div>
                <Badge tone={p.tipo === 'crochet' ? 'primary' : 'accent'}>{p.tipo}</Badge>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-lg font-extrabold text-ink">{clp(p.precio)}</p>
                  <p className="text-xs text-ink-faint">Stock: {p.stock}</p>
                </div>
                {p.catalogoPublico && (
                  <Badge tone="secondary">
                    <Share2 size={12} className="mr-1" /> Catalogo
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-surface-border pt-3">
                <button className="btn-outline flex-1 !py-1.5 text-xs" onClick={() => setProduce(p)}>
                  <Factory size={14} /> Producir
                </button>
                <button className="btn-ghost !p-1.5" title="Editar" onClick={() => setEditing(p)}>
                  <Pencil size={16} />
                </button>
                <button
                  className="btn-ghost !p-1.5 text-accent"
                  title="Eliminar"
                  onClick={() => { if (confirm(`Eliminar ${p.nombre}?`)) deleteProduct(p.id) }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <ProductForm
          initial={editing ?? empty}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSave={(data) => {
            if (editing) updateProduct(editing.id, data)
            else addProduct(data)
            setCreating(false)
            setEditing(null)
          }}
        />
      )}

      {produce && <ProduceForm product={produce} onClose={() => setProduce(null)} />}
    </div>
  )
}

function ProductForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Omit<Product, 'id' | 'createdAt'> | Product
  onClose: () => void
  onSave: (data: Omit<Product, 'id' | 'createdAt'>) => void
}) {
  const materials = useDb((db) => db.materials)
  const [f, setF] = useState({ ...initial })
  const set = (k: keyof typeof f, v: unknown) => setF((s) => ({ ...s, [k]: v }))

  const setBom = (materialId: string, cantidad: number) => {
    setF((s) => {
      const rest = s.bom.filter((b) => b.materialId !== materialId)
      return { ...s, bom: cantidad > 0 ? [...rest, { materialId, cantidad }] : rest }
    })
  }
  const bomFor = (id: string): number => f.bom.find((b) => b.materialId === id)?.cantidad ?? 0

  return (
    <Modal open onClose={onClose} title={'id' in initial ? 'Editar producto' : 'Nuevo producto'} wide>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Nombre">
            <input className="input" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
          </Field>
        </div>
        <Field label="Tipo">
          <select className="input capitalize" value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="SKU">
          <input className="input" value={f.sku} onChange={(e) => set('sku', e.target.value)} />
        </Field>
        <Field label="Precio (CLP)">
          <input type="number" className="input" value={f.precio} onChange={(e) => set('precio', Number(e.target.value))} />
        </Field>
        <Field label="Stock inicial">
          <input type="number" className="input" value={f.stock} onChange={(e) => set('stock', Number(e.target.value))} />
        </Field>
        <div className="col-span-2">
          <Field label="URL de foto (opcional)">
            <input className="input" value={f.fotoUrl} onChange={(e) => set('fotoUrl', e.target.value)} placeholder="https://..." />
          </Field>
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={f.catalogoPublico} onChange={(e) => set('catalogoPublico', e.target.checked)} />
            Mostrar en catalogo publico (compartible en redes)
          </label>
        </div>
      </div>

      <div className="mt-5">
        <p className="label">Receta de insumos (BOM) - consumo por unidad producida</p>
        {materials.length === 0 ? (
          <p className="text-sm text-ink-faint">Primero registra insumos en la pestana Insumos.</p>
        ) : (
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-surface-border p-3">
            {materials.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="flex-1 text-sm text-ink-soft">{m.nombre} <span className="text-xs text-ink-faint">({m.unidad})</span></span>
                <input
                  type="number"
                  step="0.01"
                  className="input w-28"
                  value={bomFor(m.id)}
                  onChange={(e) => setBom(m.id, Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button
          className="btn-primary"
          disabled={!f.nombre.trim()}
          onClick={() => onSave({
            nombre: f.nombre, tipo: f.tipo as ProductType, sku: f.sku, precio: f.precio,
            stock: f.stock, fotoUrl: f.fotoUrl, catalogoPublico: f.catalogoPublico,
            bom: f.bom as BomItem[],
          })}
        >
          Guardar
        </button>
      </div>
    </Modal>
  )
}

function ProduceForm({ product, onClose }: { product: Product; onClose: () => void }) {
  const materials = useDb((db) => db.materials)
  const [cantidad, setCantidad] = useState(1)

  // Verificar si hay insumos suficientes segun el BOM.
  const faltantes = product.bom
    .map((b) => {
      const m = materials.find((x) => x.id === b.materialId)
      const requerido = b.cantidad * cantidad
      return m && m.stockActual < requerido ? { nombre: m.nombre, requerido, disp: m.stockActual, unidad: m.unidad } : null
    })
    .filter(Boolean) as { nombre: string; requerido: number; disp: number; unidad: string }[]

  return (
    <Modal open onClose={onClose} title={`Producir - ${product.nombre}`}>
      <Field label="Cantidad a producir">
        <input type="number" className="input" value={cantidad} min={1} onChange={(e) => setCantidad(Number(e.target.value))} />
      </Field>

      <div className="mt-4">
        <p className="label">Consumo de insumos</p>
        {product.bom.length === 0 ? (
          <p className="text-sm text-ink-faint">Este producto no tiene receta definida.</p>
        ) : (
          <div className="space-y-1 rounded-lg bg-surface-muted p-3 text-sm">
            {product.bom.map((b) => {
              const m = materials.find((x) => x.id === b.materialId)
              if (!m) return null
              return (
                <div key={b.materialId} className="flex justify-between">
                  <span className="text-ink-soft">{m.nombre}</span>
                  <span className="font-semibold text-ink">{(b.cantidad * cantidad).toFixed(2)} {m.unidad}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {faltantes.length > 0 && (
        <div className="mt-4 rounded-lg border-l-4 border-l-accent bg-accent-50 p-3 text-sm">
          <p className="font-semibold text-accent">Stock insuficiente</p>
          <ul className="mt-1 text-ink-soft">
            {faltantes.map((x) => (
              <li key={x.nombre}>{x.nombre}: requiere {x.requerido.toFixed(2)}, hay {x.disp} {x.unidad}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button
          className="btn-primary"
          disabled={cantidad < 1}
          onClick={() => { registrarProduccion(product.id, cantidad); onClose() }}
        >
          Registrar produccion
        </button>
      </div>
    </Modal>
  )
}
