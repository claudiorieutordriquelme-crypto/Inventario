import { useState } from 'react'
import { Plus, Share2, Trash2, Image as ImageIcon, MessageCircle, Music2, Instagram, Copy } from 'lucide-react'
import { useDb, setState, uid, nowIso } from '@/lib/store'
import type { CatalogDesign } from '@/lib/types'
import { SectionTitle, Card, Badge, Modal, Field, EmptyState } from '@/components/ui'
import { compartir, linkWhatsApp, INSTAGRAM_URL, TIKTOK_URL } from '@/lib/share'

function addDesign(d: Omit<CatalogDesign, 'id' | 'createdAt'>) {
  setState((db) => ({ ...db, designs: [...db.designs, { ...d, id: uid('des'), createdAt: nowIso() }] }))
}
function deleteDesign(id: string) {
  setState((db) => ({ ...db, designs: db.designs.filter((x) => x.id !== id) }))
}

export function CatalogPage() {
  const db = useDb((d) => d)
  const [creating, setCreating] = useState(false)
  const [sharing, setSharing] = useState<CatalogDesign | null>(null)

  // Productos marcados como publicos tambien forman parte del catalogo.
  const productosPublicos = db.products.filter((p) => p.catalogoPublico)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Catalogo de disenos" sub="Disenos listos para compartir en redes sociales" />
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> Nuevo diseno
        </button>
      </div>

      {productosPublicos.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-ink-soft">Productos publicados</p>
          <div className="flex flex-wrap gap-2">
            {productosPublicos.map((p) => (
              <Badge key={p.id} tone="secondary">{p.nombre}</Badge>
            ))}
          </div>
        </div>
      )}

      {db.designs.length === 0 ? (
        <EmptyState title="Sin disenos en catalogo" hint="Crea un diseno con foto y texto para compartir." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {db.designs.map((d) => (
            <Card key={d.id} className="flex flex-col !p-0 overflow-hidden">
              <div className="flex h-40 items-center justify-center bg-surface-muted">
                {d.imagenUrl ? (
                  <img src={d.imagenUrl} alt={d.titulo} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={40} className="text-ink-faint" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="font-bold text-ink">{d.titulo}</p>
                <p className="mt-1 flex-1 text-sm text-ink-faint">{d.descripcion}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {d.tags.map((t) => <Badge key={t} tone="neutral">#{t}</Badge>)}
                </div>
                <div className="mt-3 flex gap-2 border-t border-surface-border pt-3">
                  <button className="btn-primary flex-1 !py-1.5 text-xs" onClick={() => setSharing(d)}>
                    <Share2 size={14} /> Compartir
                  </button>
                  <button className="btn-ghost !p-1.5 text-accent" onClick={() => { if (confirm('Eliminar diseno?')) deleteDesign(d.id) }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {creating && <DesignForm onClose={() => setCreating(false)} onSave={(d) => { addDesign(d); setCreating(false) }} />}
      {sharing && <ShareModal design={sharing} onClose={() => setSharing(null)} />}
    </div>
  )
}

function DesignForm({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (d: Omit<CatalogDesign, 'id' | 'createdAt'>) => void
}) {
  const [f, setF] = useState({ titulo: '', descripcion: '', tags: '', imagenUrl: '', textoCompartir: '' })
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))

  return (
    <Modal open onClose={onClose} title="Nuevo diseno">
      <div className="space-y-4">
        <Field label="Titulo">
          <input className="input" value={f.titulo} onChange={(e) => set('titulo', e.target.value)} />
        </Field>
        <Field label="Descripcion">
          <textarea className="input" rows={2} value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
        </Field>
        <Field label="Tags (separados por coma)">
          <input className="input" value={f.tags} onChange={(e) => set('tags', e.target.value)} placeholder="crochet, regalo" />
        </Field>
        <Field label="URL de imagen (opcional)">
          <input className="input" value={f.imagenUrl} onChange={(e) => set('imagenUrl', e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Texto para compartir">
          <textarea className="input" rows={2} value={f.textoCompartir} onChange={(e) => set('textoCompartir', e.target.value)} placeholder="Mensaje que acompana la publicacion" />
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button
          className="btn-primary"
          disabled={!f.titulo.trim()}
          onClick={() => onSave({
            titulo: f.titulo, descripcion: f.descripcion, imagenUrl: f.imagenUrl,
            textoCompartir: f.textoCompartir || f.titulo,
            tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
          })}
        >
          Guardar
        </button>
      </div>
    </Modal>
  )
}

function ShareModal({ design, onClose }: { design: CatalogDesign; onClose: () => void }) {
  const [msg, setMsg] = useState('')
  const texto = design.textoCompartir || design.titulo

  const nativo = async () => {
    const r = await compartir({ titulo: design.titulo, texto })
    setMsg(r === 'nativo' ? 'Compartido.' : r === 'copiado' ? 'Texto copiado al portapapeles.' : 'No se pudo compartir.')
  }
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setMsg('Texto copiado.') } catch { setMsg('No se pudo copiar.') }
  }
  const abrir = (url: string) => window.open(url, '_blank')

  return (
    <Modal open onClose={onClose} title={`Compartir: ${design.titulo}`}>
      <div className="rounded-lg bg-surface-muted p-3 text-sm text-ink-soft">{texto}</div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={nativo}><Share2 size={16} /> Compartir</button>
        <button className="btn-outline" onClick={copiar}><Copy size={16} /> Copiar texto</button>
        <button className="btn-outline" onClick={() => abrir(linkWhatsApp(texto))}><MessageCircle size={16} /> WhatsApp</button>
        <button className="btn-outline" onClick={() => { copiar(); abrir(INSTAGRAM_URL) }}><Instagram size={16} /> Instagram</button>
        <button className="btn-outline col-span-2" onClick={() => { copiar(); abrir(TIKTOK_URL) }}><Music2 size={16} /> TikTok</button>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Instagram y TikTok no permiten prellenar el texto por seguridad: se copia al portapapeles y se abre la app para que pegues y publiques.
      </p>
      {msg && <p className="mt-2 text-sm font-semibold text-primary">{msg}</p>}
    </Modal>
  )
}
