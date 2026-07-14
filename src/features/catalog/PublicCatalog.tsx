import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Clock, MessageCircle, Loader2, PackageX, Images, PlayCircle } from 'lucide-react'
import type { Product, ProductType } from '@/lib/types'
import { supabase, isCloud } from '@/lib/supabase'
import { getState } from '@/lib/store'
import { clp } from '@/lib/format'
import { linkWhatsAppTo } from '@/lib/share'
import { coverOf, imagesOf } from '@/lib/image'
import { Lightbox } from '@/components/Lightbox'
import { VideoModal } from '@/components/VideoModal'

// Vitrina publica de solo lectura. Se abre desde el link compartido, SIN login.
// En modo nube lee los productos publicos del negocio (owner) via anon key
// (politica RLS "catalogo_publico_read"). En modo local usa el store local.

const gradientes: Record<ProductType, string> = {
  crochet: 'from-primary to-primary-900',
  estampado: 'from-accent to-primary',
  otro: 'from-secondary to-primary',
}

function entregaLabel(p: Product): string {
  if (p.diasEntrega && p.diasEntrega > 0) return `Por encargo - ${p.diasEntrega} dias`
  return 'Por encargo'
}

export function PublicCatalog() {
  const [params] = useSearchParams()
  const owner = params.get('u') ?? ''
  const wsp = params.get('w') ?? ''
  const nombre = params.get('n') ?? 'Nuestro catalogo'

  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState('')
  const [gallery, setGallery] = useState<string[] | null>(null)
  const [video, setVideo] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    async function cargar() {
      try {
        if (isCloud && supabase) {
          let query = supabase.from('products').select('data')
          if (owner) query = query.eq('owner', owner)
          const { data, error } = await query
          if (error) throw error
          const rows = (data ?? []).map((r) => (r as { data: Product }).data)
          if (activo) setProducts(rows.filter((p) => p.catalogoPublico))
        } else {
          // Modo local: solo funciona en el mismo equipo.
          setProducts(getState().products.filter((p) => p.catalogoPublico))
        }
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : 'No se pudo cargar el catalogo')
      }
    }
    cargar()
    return () => {
      activo = false
    }
  }, [owner])

  const visibles = useMemo(() => products ?? [], [products])

  const pedir = (p: Product) => {
    const texto = `Hola! Quiero encargar: ${p.nombre} (${clp(p.precio)}). Esta disponible?`
    window.open(linkWhatsAppTo(wsp, texto), '_blank')
  }

  return (
    <div className="min-h-full bg-surface-muted">
      {/* Encabezado */}
      <header className="bg-ink px-4 py-8 text-center text-white">
        <h1 className="text-2xl font-extrabold tracking-tight">{nombre}</h1>
        <p className="mt-1 text-sm text-white/70">Productos por encargo - escribenos para pedir</p>
      </header>

      <div className="mx-auto max-w-6xl p-4 lg:p-8">
        {error ? (
          <div className="mx-auto max-w-md rounded-xl bg-surface p-6 text-center shadow-card">
            <PackageX className="mx-auto mb-2 text-accent" size={28} />
            <p className="font-semibold text-ink">No se pudo cargar el catalogo</p>
            <p className="mt-1 text-sm text-ink-faint">{error}</p>
          </div>
        ) : products === null ? (
          <div className="flex flex-col items-center py-20 text-ink-faint">
            <Loader2 className="animate-spin text-primary" size={28} />
            <p className="mt-2 text-sm">Cargando catalogo...</p>
          </div>
        ) : visibles.length === 0 ? (
          <div className="mx-auto max-w-md rounded-xl bg-surface p-6 text-center shadow-card">
            <p className="font-semibold text-ink">Aun no hay productos publicados</p>
            <p className="mt-1 text-sm text-ink-faint">Vuelve pronto.</p>
          </div>
        ) : (
          <div className="gap-4 [column-fill:_balance] columns-2 sm:columns-3 lg:columns-4">
            {visibles.map((p) => {
              const imgs = imagesOf(p)
              const cover = coverOf(p)
              return (
              <div key={p.id} className="mb-4 break-inside-avoid">
                <div className="overflow-hidden rounded-xl bg-surface shadow-card">
                  <div className="relative">
                    {cover ? (
                      <button type="button" className="block w-full" onClick={() => setGallery(imgs)}>
                        <img src={cover} alt={p.nombre} loading="lazy" className="w-full" />
                      </button>
                    ) : (
                      <div className={`flex aspect-[4/5] w-full items-center justify-center bg-gradient-to-br ${gradientes[p.tipo]}`}>
                        <span className="px-3 text-center text-lg font-extrabold text-white/90">{p.nombre}</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 rounded-lg bg-surface/95 px-2.5 py-1 text-sm font-extrabold text-ink shadow-card">
                      {clp(p.precio)}
                    </div>
                    {imgs.length > 1 && (
                      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1 text-xs font-semibold text-white">
                        <Images size={12} /> {imgs.length}
                      </div>
                    )}
                    {p.videoUrl && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={() => setVideo(p.videoUrl as string)}
                          className="pointer-events-auto rounded-full bg-ink/50 p-1 text-white/90 transition-colors hover:bg-ink/70"
                          title="Ver video"
                        >
                          <PlayCircle size={40} className="drop-shadow-lg" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold leading-tight text-ink">{p.nombre}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
                      <Clock size={12} /> {entregaLabel(p)}
                    </p>
                    {p.descripcion && <p className="mt-1.5 line-clamp-3 text-xs text-ink-soft">{p.descripcion}</p>}
                    <button className="btn-accent mt-3 w-full !py-1.5 text-xs" onClick={() => pedir(p)}>
                      <MessageCircle size={14} /> Pedir por WhatsApp
                    </button>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-ink-faint">Hecho con Artesania Manager</p>
      </div>

      {gallery && <Lightbox images={gallery} onClose={() => setGallery(null)} />}
      {video && <VideoModal url={video} onClose={() => setVideo(null)} />}
    </div>
  )
}
