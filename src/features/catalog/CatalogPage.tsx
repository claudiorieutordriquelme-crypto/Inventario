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
  Images,
  Trash2,
  Star,
  Send,
  Video,
  PlayCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useDb, getCurrentUserId } from '@/lib/store'
import type { Product, ProductType } from '@/lib/types'
import { updateProduct } from '@/lib/inventory'
import { SectionTitle, Card, Badge, Modal, Field, EmptyState } from '@/components/ui'
import { Lightbox } from '@/components/Lightbox'
import { VideoModal } from '@/components/VideoModal'
import { SmartImage } from '@/components/SmartImage'
import { clp } from '@/lib/format'
import { compressImage, coverOf, imagesOf, isPlayableVideo } from '@/lib/image'
import { compartir, linkWhatsApp, linkWhatsAppTo, INSTAGRAM_URL, TIKTOK_URL } from '@/lib/share'

type Filtro = 'todos' | ProductType

const WSP_KEY = 'artesania:whatsapp'
const NOMBRE_KEY = 'artesania:negocio'
const MAX_IMG = 6

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
  const [catFiltro, setCatFiltro] = useState('')
  const [soloPublicos, setSoloPublicos] = useState(false)
  const [sharing, setSharing] = useState<Product | null>(null)
  const [editGallery, setEditGallery] = useState<Product | null>(null)
  const [lightbox, setLightbox] = useState<string[] | null>(null)
  const [video, setVideo] = useState<string | null>(null)
  const [shareCat, setShareCat] = useState(false)
  const [wsp, setWsp] = useState('')
  const [negocio, setNegocio] = useState('')

  useEffect(() => {
    setWsp(localStorage.getItem(WSP_KEY) ?? '')
    setNegocio(localStorage.getItem(NOMBRE_KEY) ?? '')
  }, [])
  const guardarWsp = (v: string) => { setWsp(v); localStorage.setItem(WSP_KEY, v) }

  // Categorias presentes en los productos (para el filtro).
  const categorias = useMemo(
    () => Array.from(new Set(products.map((p) => p.categoria).filter(Boolean))) as string[],
    [products],
  )

  const visibles = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (filtro !== 'todos' && p.tipo !== filtro) return false
      if (catFiltro && p.categoria !== catFiltro) return false
      if (soloPublicos && !p.catalogoPublico) return false
      if (q && !p.nombre.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false
      return true
    })
  }, [products, search, filtro, catFiltro, soloPublicos])

  const filtros: { id: Filtro; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'crochet', label: 'Crochet' },
    { id: 'estampado', label: 'Estampado' },
    { id: 'otro', label: 'Otros' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Catalogo" sub="Vitrina de productos por encargo, lista para compartir en redes" />
        <button className="btn-primary" onClick={() => setShareCat(true)}>
          <Send size={16} /> Compartir catalogo
        </button>
      </div>

      {!wsp && (
        <div className="rounded-xl border-l-4 border-l-accent bg-accent-50 p-4">
          <p className="text-sm font-semibold text-ink">Configura tu WhatsApp para recibir pedidos</p>
          <p className="mb-2 text-xs text-ink-soft">Los botones "Pedir por WhatsApp" abriran una conversacion a este numero.</p>
          <input
            className="input max-w-xs"
            placeholder="+56 9 XXXX XXXX"
            onBlur={(e) => e.target.value && guardarWsp(e.target.value)}
          />
        </div>
      )}

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
          {categorias.length > 0 && (
            <select
              className="input w-auto"
              value={catFiltro}
              onChange={(e) => setCatFiltro(e.target.value)}
            >
              <option value="">Todas las categorias</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 whitespace-nowrap text-sm text-ink-soft">
            <input type="checkbox" checked={soloPublicos} onChange={(e) => setSoloPublicos(e.target.checked)} />
            Solo publicados
          </label>
        </div>
        {wsp && (
          <div className="mt-3 flex items-center gap-2 border-t border-surface-border pt-3 text-sm text-ink-soft">
            <Phone size={14} className="text-secondary" />
            Pedidos a: <b className="text-ink">{wsp}</b>
            <button className="ml-2 text-xs font-semibold text-primary hover:underline" onClick={() => guardarWsp('')}>cambiar</button>
          </div>
        )}
      </Card>

      {visibles.length === 0 ? (
        <EmptyState
          title="Sin productos para mostrar"
          hint="Crea productos en Inventario o ajusta los filtros. Agrega fotos para armar tu vitrina."
        />
      ) : (
        <div className="gap-4 [column-fill:_balance] columns-2 sm:columns-3 xl:columns-4">
          {visibles.map((p, i) => (
            <div key={p.id} className="mb-4 break-inside-avoid">
              <ProductoCard
                product={p}
                index={i}
                wsp={wsp}
                onShare={() => setSharing(p)}
                onGallery={() => setEditGallery(p)}
                onView={(imgs) => setLightbox(imgs)}
                onVideo={(u) => setVideo(u)}
              />
            </div>
          ))}
        </div>
      )}

      {sharing && <ShareProductModal product={sharing} wsp={wsp} onClose={() => setSharing(null)} />}
      {editGallery && <GalleryModal product={editGallery} onClose={() => setEditGallery(null)} />}
      {lightbox && <Lightbox images={lightbox} onClose={() => setLightbox(null)} />}
      {video && <VideoModal url={video} onClose={() => setVideo(null)} />}
      {shareCat && (
        <ShareCatalogModal
          wsp={wsp}
          negocio={negocio}
          onNegocio={(v) => { setNegocio(v); localStorage.setItem(NOMBRE_KEY, v) }}
          onClose={() => setShareCat(false)}
        />
      )}
    </div>
  )
}

function ProductoCard({
  product: p,
  index,
  wsp,
  onShare,
  onGallery,
  onView,
  onVideo,
}: {
  product: Product
  index: number
  wsp: string
  onShare: () => void
  onGallery: () => void
  onView: (imgs: string[]) => void
  onVideo: (url: string) => void
}) {
  const imgs = imagesOf(p)
  const cover = coverOf(p)
  const [hover, setHover] = useState(false)
  const previewVideo = p.videoUrl && isPlayableVideo(p.videoUrl)

  const pedir = () => {
    const texto = `Hola! Quiero encargar: ${p.nombre} (${clp(p.precio)}). Esta disponible?`
    window.open(linkWhatsAppTo(wsp, texto), '_blank')
  }

  return (
    <motion.div
      className="group card overflow-hidden !p-0"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4), ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative overflow-hidden">
        {cover ? (
          <button type="button" className="block w-full" onClick={() => onView(imgs)}>
            <SmartImage src={cover} alt={p.nombre} imgClassName="transition-transform duration-300 group-hover:scale-105" />
            {/* Preview de video en hover (tipo TikTok) para videos reproducibles */}
            {previewVideo && hover && (
              <video
                src={p.videoUrl}
                muted
                loop
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </button>
        ) : (
          <div className={`flex aspect-[4/5] w-full items-center justify-center bg-gradient-to-br ${gradientes[p.tipo]}`}>
            <span className="px-3 text-center text-lg font-extrabold text-white/90">{p.nombre}</span>
          </div>
        )}
        {/* Scrim editorial para legibilidad sobre la foto */}
        {cover && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-ink/20" />}
        <div className="absolute bottom-2 left-2 rounded-lg bg-surface/95 px-2.5 py-1 text-sm font-extrabold text-ink shadow-card">
          {clp(p.precio)}
        </div>
        {imgs.length > 1 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1 text-xs font-semibold text-white">
            <Images size={12} /> {imgs.length}
          </div>
        )}
        {p.videoUrl && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => onVideo(p.videoUrl as string)}
              className="pointer-events-auto rounded-full bg-ink/50 p-1 text-white/90 transition-colors hover:bg-ink/70"
              title="Ver video"
            >
              <PlayCircle size={40} className="drop-shadow-lg" />
            </button>
          </div>
        )}
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
          onClick={onGallery}
          className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
          title="Gestionar fotos"
        >
          <ImagePlus size={12} /> Fotos
        </button>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold leading-tight text-ink">{p.nombre}</p>
          <Badge tone={p.tipo === 'estampado' ? 'accent' : 'primary'}>{p.tipo}</Badge>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
          <Clock size={12} /> {entregaLabel(p)}
        </p>
        {p.categoria && <p className="mt-0.5 text-xs font-medium text-primary">{p.categoria}</p>}
        {p.descripcion && <p className="mt-1.5 line-clamp-2 text-xs text-ink-soft">{p.descripcion}</p>}
        <div className="mt-3 flex gap-2">
          <button className="btn-accent flex-1 !py-1.5 text-xs" onClick={pedir}>
            <MessageCircle size={14} /> Pedir
          </button>
          <button className="btn-outline !px-2.5 !py-1.5" onClick={onShare} title="Compartir">
            <Share2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function GalleryModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [imgs, setImgs] = useState<string[]>(imagesOf(product))
  const [url, setUrl] = useState('')
  const [descripcion, setDescripcion] = useState(product.descripcion ?? '')
  const [videoUrl, setVideoUrl] = useState(product.videoUrl ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const add = (src: string) => setImgs((arr) => (arr.length >= MAX_IMG ? arr : [...arr, src]))
  const quitar = (i: number) => setImgs((arr) => arr.filter((_, idx) => idx !== i))
  const hacerPortada = (i: number) => setImgs((arr) => [arr[i], ...arr.filter((_, idx) => idx !== i)])

  const onFiles = async (files: FileList) => {
    setBusy(true)
    setError('')
    try {
      for (const file of Array.from(files).slice(0, MAX_IMG)) {
        const dataUrl = await compressImage(file)
        add(dataUrl)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar la imagen')
    } finally {
      setBusy(false)
    }
  }

  const guardar = () => {
    updateProduct(product.id, {
      imagenes: imgs,
      fotoUrl: imgs[0] ?? '',
      descripcion: descripcion.trim(),
      videoUrl: videoUrl.trim(),
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={`Ficha - ${product.nombre}`} wide>
      <p className="mb-3 text-sm text-ink-faint">
        Agrega hasta {MAX_IMG} fotos (idealmente 3 o mas). La primera es la portada.
      </p>

      {imgs.length === 0 ? (
        <div className="flex aspect-video items-center justify-center rounded-xl bg-surface-muted text-ink-faint">
          <Package size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {imgs.map((src, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-lg bg-surface-muted">
              <img src={src} alt={`foto ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-ink">Portada</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink/40 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <button className="rounded-full bg-surface p-1.5 text-ink" title="Hacer portada" onClick={() => hacerPortada(i)}>
                    <Star size={14} />
                  </button>
                )}
                <button className="rounded-full bg-surface p-1.5 text-accent" title="Quitar" onClick={() => quitar(i)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-3">
        <button className="btn-outline w-full" disabled={busy || imgs.length >= MAX_IMG} onClick={() => fileRef.current?.click()}>
          <ImagePlus size={16} /> {busy ? 'Procesando...' : `Subir fotos (${imgs.length}/${MAX_IMG})`}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && onFiles(e.target.files)}
        />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="input pl-9" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="O pegar URL de imagen" />
          </div>
          <button
            className="btn-outline"
            disabled={!url.trim() || imgs.length >= MAX_IMG}
            onClick={() => { add(url.trim()); setUrl('') }}
          >
            Agregar
          </button>
        </div>
        {error && <p className="text-sm font-medium text-accent">{error}</p>}
      </div>

      <div className="mt-5 space-y-4 border-t border-surface-border pt-4">
        <Field label="Descripcion breve">
          <textarea
            className="input"
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Materiales, medidas, personalizacion..."
          />
        </Field>
        <Field label="Video (link de YouTube, Instagram, TikTok o .mp4)">
          <div className="relative">
            <Video size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input pl-9"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </Field>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={guardar}>Guardar</button>
      </div>
    </Modal>
  )
}

function ShareProductModal({ product, wsp, onClose }: { product: Product; wsp: string; onClose: () => void }) {
  const [msg, setMsg] = useState('')
  const texto = `${product.nombre} - ${clp(product.precio)}. ${entregaLabel(product)}. Escribenos para encargar!`
  const cover = coverOf(product)

  const nativo = async () => {
    const r = await compartir({ titulo: product.nombre, texto })
    setMsg(r === 'nativo' ? 'Compartido.' : r === 'copiado' ? 'Texto copiado.' : 'No se pudo compartir.')
  }
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setMsg('Texto copiado.') } catch { setMsg('No se pudo copiar.') }
  }
  const abrir = (url: string) => window.open(url, '_blank')

  return (
    <Modal open onClose={onClose} title={`Compartir: ${product.nombre}`}>
      {cover && <img src={cover} alt={product.nombre} className="mb-3 max-h-56 w-full rounded-lg object-cover" />}
      <div className="rounded-lg bg-surface-muted p-3 text-sm text-ink-soft">{texto}</div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={nativo}><Share2 size={16} /> Compartir</button>
        <button className="btn-outline" onClick={copiar}><Copy size={16} /> Copiar texto</button>
        <button className="btn-outline" onClick={() => abrir(linkWhatsAppTo(wsp, texto))}><MessageCircle size={16} /> WhatsApp</button>
        <button className="btn-outline" onClick={() => { copiar(); abrir(INSTAGRAM_URL) }}><Instagram size={16} /> Instagram</button>
        <button className="btn-outline col-span-2" onClick={() => { copiar(); abrir(TIKTOK_URL) }}><Music2 size={16} /> TikTok</button>
      </div>
      {msg && <p className="mt-2 text-sm font-semibold text-primary">{msg}</p>}
    </Modal>
  )
}

function ShareCatalogModal({
  wsp,
  negocio,
  onNegocio,
  onClose,
}: {
  wsp: string
  negocio: string
  onNegocio: (v: string) => void
  onClose: () => void
}) {
  const [msg, setMsg] = useState('')

  const link = useMemo(() => {
    const owner = getCurrentUserId() ?? ''
    const params = new URLSearchParams()
    if (owner) params.set('u', owner)
    const w = (wsp || '').replace(/\D/g, '')
    if (w) params.set('w', w)
    if (negocio) params.set('n', negocio)
    return `${location.origin}${location.pathname}#/c?${params.toString()}`
  }, [wsp, negocio])

  const texto = `Mira nuestro catalogo${negocio ? ` de ${negocio}` : ''}: ${link}`

  const copiar = async () => {
    try { await navigator.clipboard.writeText(link); setMsg('Link copiado.') } catch { setMsg('No se pudo copiar.') }
  }
  const abrir = (url: string) => window.open(url, '_blank')
  const nativo = async () => {
    const r = await compartir({ titulo: 'Catalogo', texto, url: link })
    setMsg(r === 'nativo' ? 'Compartido.' : r === 'copiado' ? 'Copiado al portapapeles.' : 'No se pudo compartir.')
  }

  return (
    <Modal open onClose={onClose} title="Compartir catalogo completo">
      <Field label="Nombre del negocio (aparece en el catalogo)">
        <input className="input" value={negocio} onChange={(e) => onNegocio(e.target.value)} placeholder="Ej: Tejidos Cami" />
      </Field>

      <div className="mt-4">
        <p className="label">Link publico del catalogo</p>
        <div className="flex gap-2">
          <input className="input flex-1 text-xs" value={link} readOnly onFocus={(e) => e.target.select()} />
          <button className="btn-outline" onClick={copiar}><Copy size={16} /></button>
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          Muestra solo los productos marcados como publicados. Cualquiera con el link lo ve, sin iniciar sesion.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={nativo}><Share2 size={16} /> Compartir</button>
        <button className="btn-outline" onClick={() => abrir(linkWhatsApp(texto))}><MessageCircle size={16} /> WhatsApp</button>
        <button className="btn-outline" onClick={() => { copiar(); abrir(INSTAGRAM_URL) }}><Instagram size={16} /> Instagram</button>
        <button className="btn-outline" onClick={() => { copiar(); abrir(TIKTOK_URL) }}><Music2 size={16} /> TikTok</button>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        En Instagram y TikTok pega el link en tu bio o en la descripcion; se copia automaticamente al portapapeles.
      </p>
      {msg && <p className="mt-2 text-sm font-semibold text-primary">{msg}</p>}
    </Modal>
  )
}
