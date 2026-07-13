import { useState } from 'react'
import { Plus, Pencil, Trash2, ArrowDownUp } from 'lucide-react'
import { useDb } from '@/lib/store'
import type { Material, MaterialCategory } from '@/lib/types'
import { Card, Badge, Modal, Field, EmptyState } from '@/components/ui'
import { clp } from '@/lib/format'
import {
  addMaterial,
  updateMaterial,
  deleteMaterial,
  ajustarStockMaterial,
  stockStatus,
} from '@/lib/inventory'

const CATEGORIAS: MaterialCategory[] = ['lana', 'hilo', 'tela', 'tinta', 'insumo']

const statusTone = { critico: 'accent', bajo: 'accent', ok: 'secondary' } as const
const statusLabel = { critico: 'Sin stock', bajo: 'Bajo', ok: 'OK' } as const

const empty: Omit<Material, 'id' | 'createdAt'> = {
  nombre: '', categoria: 'lana', unidad: 'unidad', stockActual: 0, stockMinimo: 0,
  costoUnitario: 0, leadTimeDias: 7, proveedor: '',
}

export function MaterialsTab() {
  const materials = useDb((db) => db.materials)
  const [editing, setEditing] = useState<Material | null>(null)
  const [creating, setCreating] = useState(false)
  const [adjust, setAdjust] = useState<Material | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> Nuevo insumo
        </button>
      </div>

      {materials.length === 0 ? (
        <EmptyState title="Sin insumos" hint="Agrega tu primer material para empezar a controlar stock." />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-4 py-3">Insumo</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Minimo</th>
                  <th className="px-4 py-3 text-right">Costo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {materials.map((m) => {
                  const st = stockStatus(m)
                  return (
                    <tr key={m.id} className="hover:bg-surface-muted/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{m.nombre}</p>
                        <p className="text-xs text-ink-faint">{m.proveedor || 'Sin proveedor'} - LT {m.leadTimeDias}d</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-ink-soft">{m.categoria}</td>
                      <td className="px-4 py-3 text-right font-semibold">{m.stockActual} <span className="text-xs text-ink-faint">{m.unidad}</span></td>
                      <td className="px-4 py-3 text-right text-ink-soft">{m.stockMinimo}</td>
                      <td className="px-4 py-3 text-right text-ink-soft">{clp(m.costoUnitario)}</td>
                      <td className="px-4 py-3"><Badge tone={statusTone[st]}>{statusLabel[st]}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button className="btn-ghost !p-1.5" title="Ajustar stock" onClick={() => setAdjust(m)}>
                            <ArrowDownUp size={16} />
                          </button>
                          <button className="btn-ghost !p-1.5" title="Editar" onClick={() => setEditing(m)}>
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn-ghost !p-1.5 text-accent"
                            title="Eliminar"
                            onClick={() => { if (confirm(`Eliminar ${m.nombre}?`)) deleteMaterial(m.id) }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {(creating || editing) && (
        <MaterialForm
          initial={editing ?? empty}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSave={(data) => {
            if (editing) updateMaterial(editing.id, data)
            else addMaterial(data)
            setCreating(false)
            setEditing(null)
          }}
        />
      )}

      {adjust && <AdjustForm material={adjust} onClose={() => setAdjust(null)} />}
    </div>
  )
}

function MaterialForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Omit<Material, 'id' | 'createdAt'> | Material
  onClose: () => void
  onSave: (data: Omit<Material, 'id' | 'createdAt'>) => void
}) {
  const [f, setF] = useState({ ...initial })
  const set = (k: keyof typeof f, v: string | number) => setF((s) => ({ ...s, [k]: v }))

  return (
    <Modal open onClose={onClose} title={'id' in initial ? 'Editar insumo' : 'Nuevo insumo'}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Nombre">
            <input className="input" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
          </Field>
        </div>
        <Field label="Categoria">
          <select className="input capitalize" value={f.categoria} onChange={(e) => set('categoria', e.target.value)}>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Unidad">
          <input className="input" value={f.unidad} onChange={(e) => set('unidad', e.target.value)} />
        </Field>
        <Field label="Stock actual">
          <input type="number" className="input" value={f.stockActual} onChange={(e) => set('stockActual', Number(e.target.value))} />
        </Field>
        <Field label="Stock minimo (ROP)">
          <input type="number" className="input" value={f.stockMinimo} onChange={(e) => set('stockMinimo', Number(e.target.value))} />
        </Field>
        <Field label="Costo unitario (CLP)">
          <input type="number" className="input" value={f.costoUnitario} onChange={(e) => set('costoUnitario', Number(e.target.value))} />
        </Field>
        <Field label="Lead time (dias)">
          <input type="number" className="input" value={f.leadTimeDias} onChange={(e) => set('leadTimeDias', Number(e.target.value))} />
        </Field>
        <div className="col-span-2">
          <Field label="Proveedor">
            <input className="input" value={f.proveedor} onChange={(e) => set('proveedor', e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button
          className="btn-primary"
          disabled={!f.nombre.trim()}
          onClick={() => onSave({
            nombre: f.nombre, categoria: f.categoria as MaterialCategory, unidad: f.unidad,
            stockActual: f.stockActual, stockMinimo: f.stockMinimo, costoUnitario: f.costoUnitario,
            leadTimeDias: f.leadTimeDias, proveedor: f.proveedor,
          })}
        >
          Guardar
        </button>
      </div>
    </Modal>
  )
}

function AdjustForm({ material, onClose }: { material: Material; onClose: () => void }) {
  const [tipo, setTipo] = useState<'entrada' | 'salida' | 'ajuste'>('entrada')
  const [cantidad, setCantidad] = useState(1)
  const [motivo, setMotivo] = useState('')

  const aplicar = () => {
    const delta = tipo === 'salida' ? -Math.abs(cantidad) : Math.abs(cantidad)
    ajustarStockMaterial(material.id, delta, tipo, motivo || tipo)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={`Ajustar stock - ${material.nombre}`}>
      <p className="mb-4 text-sm text-ink-faint">Stock actual: <b className="text-ink">{material.stockActual} {material.unidad}</b></p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo de movimiento">
          <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
            <option value="entrada">Entrada (compra)</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
          </select>
        </Field>
        <Field label="Cantidad">
          <input type="number" className="input" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
        </Field>
        <div className="col-span-2">
          <Field label="Motivo">
            <input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: compra a proveedor" />
          </Field>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={aplicar}>Aplicar</button>
      </div>
    </Modal>
  )
}
