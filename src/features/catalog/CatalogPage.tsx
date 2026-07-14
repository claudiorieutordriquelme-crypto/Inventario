import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search,
  Share2,
  ImagePlus,
  Eye,
  EyeOff,
  MessageCircle,
  Music2,
  Instagram,
  Copy,
  Link as LinkIcon,
  Package,
  Clock,
  Phone,
} from 'lucide-react'
import { useDb } from '@/lib/store'
import type { Product, ProductType } from '@/lib/types'
import { updateProduct } from '@/lib/inventory'
import { SectionTitle, Card, Badge, Modal, Field, EmptyState } from '@/components/ui'
import { clp } from '@/lib/format'
import { compressImage } from '@/lib/image'
import { compartir, linkWhatsAppTo, INSTAGRAM_URL, TIKTOK_URL } from '@/lib/share'

type Filtro = 'todos' | ProductType

// WhatsApp del negocio (donde llegan los pedidos). Se guarda local en el equipo.
const WSP_KEY = 'artesania:whatsapp'

const gradientes: Record<ProductType, string> = {
  crochet: 'from-primary to-primary-900',
  estampado: 'from-accent to-primary',
  otro: 'from-secondary to-primary',
}

function entregaLabel(p: Product): string {
  if (p.diasEntrega && p.diasEntrega > 0) return `Por encargo - ${p.diasEntrega} dias`
  return 'Por encargo'
}

export function CatalogPage() {
  const products = useDb((db) => db.products)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [soloPublicos, setSoloPublicos] = useState(false)
  const [sharing, setSharing] = useState<Product | null>(null)
  const [editImg, setEditImg] = useState<Product | null>(null)
  const [wsp, setWsp] = useState('')

  useEffect(() => {
    setWsp(localStorage.getItem(WSP_KEY) ?? '')
  }, [])
  const guardarWsp = (v: string) => {
    setWsp(v)
    localStorage.setItem(WSP_KEY, v)
  }

  const visibles = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (filtro !== 'todos' && p.tipo !== filtro) return false
      if (soloPublicos && !p.catalogoPublico) return false
      if (q && !p.nombre.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false
      return true
    })
  }, [products, search, filtro, soloPublicos])

  const filtros: { id: Filtro; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'crochet', label: 'Crochet' },
    { id: 'estampado', label: 'Estampado' },
    { id: 'otro', label: 'Otros' },
  ]

  return (
    <div className="space-y-6">
      <SectionTitle title="Catalogo" sub="Vitrina de productos por encargo, lista para compartir en redes" />

      {/* Configurar WhatsApp del negocio */}
      {!wsp && (
        <div className="rounded-xl border-l-4 border-l-accent bg-accent-50 p-4">
          <p className="text-sm font-semibold text-ink">Configura tu WhatsApp para recibir pedidos</p>
          <p className="mb-2 text-xs text-ink-soft">Los botones "Pedir por WhatsApp" abriran una conversacion a este numero.</p>
          <div className="flex gap-2">
            <input
              className="input max-w-xs"
              placeholder="+56 9 XXXX XXXX"
              onBlur={(e) => e.target.value && guardarWsp(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Barra de filtros */}
      <Card className="!p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input pl-9"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {filtros.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  filtro === f.id ? 'bg-primary text-white' : 'bg-surface-muted text-ink-soft hover:bg-primary-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 whitespace-nowrap text-sm text-ink-soft">
            <input type="checkbox" checked={soloPublicos} onChange={(e) => setSoloPublicos(e.target.checked)} />
            Solo publicados
          </label>
        </div>
        {wsp && (
          <div className="mt-3 flex items-center gap-2 border-t border-surface-border pt-3 text-sm text-ink-soft">
            <Phone size={14} className="text-secondary" />
            Pedidos a: <b className="text-ink">{wsp}</b>
            <button className="ml-2 text-xs font-semibold text-primary hover:underline" onClick={() => guardarWsp('')}>
              cambiar
            </button>
          </div>
        )}
      </Card>

      {visibles.length === 0 ? (
        <EmptyState
          title="Sin productos para mostrar"
          hint="Crea productos en Inventario o ajusta los filtros. Agrega fotos para armar tu vitrina."
        />
      ) : (
        // Masonry con CSS columns: respeta el alto natural de cada foto.
        <div className="gap-4 [column-fill:_balance] columns-2 sm:columns-3 xl:columns-4">
          {visibles.map((p) => (
            <div key={p.id} className="mb-4 break-inside-avoid">
              <ProductoCard
                product={p}
                wsp={wsp}
                onShare={() => setSharing(p)}
                onImage={() => setEditImg(p)}
              />
            </div>
          ))}
        </div>
      )}

      {sharing && <ShareModal product={sharing} wsp={wsp} onClose={() => setSharing(null)} />}
      {editImg && <ImageModal product={editImg} onClose={() => setEditImg(null)} />}
    </div>
  )
}

function ProductoCard({
  product: p,
  wsp,
  onShare,
  onImage,
}: {
  product: Product
  wsp: string
  onShare: () => void
  onImage: () => void
}) {
  const pedir = () => {
    const texto = `Hola! Quiero encargar: ${p.nombre} (${clp(p.precio)}). Esta disponible?`
    window.open(linkWhatsAppTo(wsp, texto), '_blank')
  }

  return (
    <div className="group card overflow-hidden !p-0">
      {/* Portada (alto natural en fotos reales, aspecto fijo en placeholder) */}
      <div className="relative overflow-hidden">
        {p.fotoUrl ? (
          <img
            src={p.fotoUrl}
            alt={p.nombre}
            loading="lazy"
            className="w-full transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`flex aspect-[4/5] w-full items-center justify-center bg-gradient-to-br ${gradientes[p.tipo]}`}>
            <span className="px-3 text-center text-lg font-extrabold text-white/90">{p.nombre}</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 rounded-lg bg-surface/95 px-2.5 py-1 text-sm font-extrabold text-ink shadow-card">
          {clp(p.precio)}
        </div>
        <div className="absolute right-2 top-2">
          <button
            onClick={() => updateProduct(p.id, { catalogoPublico: !p.catalogoPublico })}
            title={p.catalogoPublico ? 'Publicado (click para ocultar)' : 'Oculto (click para publicar)'}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
              p.catalogoPublico ? 'bg-secondary text-ink' : 'bg-ink/70 text-white'
            }`}
          >
            {p.catalogoPublico ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>
        <button
          onClick={onImage}
          className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
          title="Cambiar imagen"
        >
          <ImagePlus size={12} /> Foto
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold leading-tight text-ink">{p.nombre}</p>
          <Badge tone={p.tipo === 'estampado' ? 'accent' : 'primary'}>{p.tipo}</Badge>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
          <Clock size={12} /> {entregaLabel(p)}
        </p>
        <div className="mt-3 flex gap-2">
          <button className="btn-accent flex-1 !py-1.5 text-xs" onClick={pedir}>
            <MessageCircle size={14} /> Pedir
          </button>
          <button className="btn-outline !px-2.5 !py-1.5" onClick={onShare} title="Compartir">
            <Share2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function ImageModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [url, setUrl] = useState(product.fotoUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = async (file: File) => {
    setBusy(true)
    setError('')
    try {
      setUrl(await compressImage(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar la imagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Imagen - ${product.nombre}`}>
      <div className="mb-4 flex justify-center">
        <div className="aspect-[4/5] w-40 overflow-hidden rounded-xl bg-surface-muted">
          {url ? (
            <img src={url} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-faint">
              <Package size={32} />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <button className="btn-outline w-full" disabled={busy} onClick={() => fileRef.current?.click()}>
          <ImagePlus size={16} /> {busy ? 'Procesando...' : 'Subir foto desde el equipo'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <Field label="O pegar URL de imagen">
          <div className="relative">
            <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="input pl-9" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
        </Field>
        {error && <p className="text-sm font-medium text-accent">{error}</p>}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        {url && (
          <button className="btn-ghost text-accent" onClick={() => { updateProduct(product.id, { fotoUrl: '' }); onClose() }}>
            Quitar imagen
          </button>
        )}
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={() => { updateProduct(product.id, { fotoUrl: url }); onClose() }}>
          Guardar
        </button>
      </div>
    </Modal>
  )
}

function ShareModal({ product, wsp, onClose }: { product: Product; wsp: string; onClose: () => void }) {
  const [msg, setMsg] = useState('')
  const texto = `${product.nombre} - ${clp(product.precio)}. ${entregaLabel(product)}. Escribenos para encargar!`

  const nativo = async () => {
    const r = await compartir({ titulo: product.nombre, texto })
    setMsg(r === 'nativo' ? 'Compartido.' : r === 'copiado' ? 'Texto copiado al portapapeles.' : 'No se pudo compartir.')
  }
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setMsg('Texto copiado.') } catch { setMsg('No se pudo copiar.') }
  }
  const abrir = (url: string) => window.open(url, '_blank')

  return (
    <Modal open onClose={onClose} title={`Compartir: ${product.nombre}`}>
      {product.fotoUrl && (
        <img src={product.fotoUrl} alt={product.nombre} className="mb-3 max-h-56 w-full rounded-lg object-cover" />
      )}
      <div className="rounded-lg bg-surface-muted p-3 text-sm text-ink-soft">{texto}</div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={nativo}><Share2 size={16} /> Compartir</button>
        <button className="btn-outline" onClick={copiar}><Copy size={16} /> Copiar texto</button>
        <button className="btn-outline" onClick={() => abrir(linkWhatsAppTo(wsp, texto))}><MessageCircle size={16} /> WhatsApp</button>
        <button className="btn-outline" onClick={() => { copiar(); abrir(INSTAGRAM_URL) }}><Instagram size={16} /> Instagram</button>
        <button className="btn-outline col-span-2" onClick={() => { copiar(); abrir(TIKTOK_URL) }}><Music2 size={16} /> TikTok</button>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Instagram y TikTok no permiten prellenar texto: se copia al portapapeles y se abre la app para pegar y publicar.
      </p>
      {msg && <p className="mt-2 text-sm font-semibold text-primary">{msg}</p>}
    </Modal>
  )
}
