import { useState } from 'react'
import { Plus, Pencil, Trash2, Phone, Mail } from 'lucide-react'
import { useDb } from '@/lib/store'
import type { Customer } from '@/lib/types'
import { SectionTitle, Card, Badge, Modal, Field, EmptyState } from '@/components/ui'
import { fecha } from '@/lib/format'
import { addCustomer, updateCustomer, deleteCustomer } from '@/lib/funnel'

const empty: Omit<Customer, 'id' | 'createdAt'> = {
  nombre: '', telefono: '', email: '', canal: 'Instagram',
}

export function CustomersPage() {
  const db = useDb((d) => d)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [creating, setCreating] = useState(false)

  const pedidosDe = (id: string) => db.orders.filter((o) => o.customerId === id).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Clientes" sub="Base de contactos y canal de captacion" />
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      {db.customers.length === 0 ? (
        <EmptyState title="Sin clientes" hint="Agrega tu primer cliente para asociarlo a pedidos." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {db.customers.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-ink">{c.nombre}</p>
                  <Badge tone="primary">{c.canal}</Badge>
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost !p-1.5" onClick={() => setEditing(c)} title="Editar"><Pencil size={16} /></button>
                  <button
                    className="btn-ghost !p-1.5 text-accent"
                    title="Eliminar"
                    onClick={() => { if (confirm(`Eliminar ${c.nombre} y sus pedidos?`)) deleteCustomer(c.id) }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-ink-soft">
                {c.telefono && <p className="flex items-center gap-2"><Phone size={14} /> {c.telefono}</p>}
                {c.email && <p className="flex items-center gap-2"><Mail size={14} /> {c.email}</p>}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3 text-xs text-ink-faint">
                <span>{pedidosDe(c.id)} pedido(s)</span>
                <span>Desde {fecha(c.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CustomerForm
          initial={editing ?? empty}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSave={(data) => {
            if (editing) updateCustomer(editing.id, data)
            else addCustomer(data)
            setCreating(false); setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function CustomerForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Omit<Customer, 'id' | 'createdAt'> | Customer
  onClose: () => void
  onSave: (d: Omit<Customer, 'id' | 'createdAt'>) => void
}) {
  const [f, setF] = useState({ ...initial })
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))

  return (
    <Modal open onClose={onClose} title={'id' in initial ? 'Editar cliente' : 'Nuevo cliente'}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Nombre">
            <input className="input" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
          </Field>
        </div>
        <Field label="Telefono">
          <input className="input" value={f.telefono} onChange={(e) => set('telefono', e.target.value)} />
        </Field>
        <Field label="Canal">
          <select className="input" value={f.canal} onChange={(e) => set('canal', e.target.value)}>
            {['Instagram', 'TikTok', 'WhatsApp', 'Feria', 'Referido', 'Otro'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <div className="col-span-2">
          <Field label="Email">
            <input className="input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button
          className="btn-primary"
          disabled={!f.nombre.trim()}
          onClick={() => onSave({ nombre: f.nombre, telefono: f.telefono, email: f.email, canal: f.canal })}
        >
          Guardar
        </button>
      </div>
    </Modal>
  )
}
