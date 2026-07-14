import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

// Visor de galeria a pantalla completa con navegacion entre imagenes.
export function Lightbox({
  images,
  start = 0,
  onClose,
}: {
  images: string[]
  start?: number
  onClose: () => void
}) {
  const [i, setI] = useState(start)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setI((v) => (v + 1) % images.length)
      if (e.key === 'ArrowLeft') setI((v) => (v - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  if (!images.length) return null
  const prev = () => setI((v) => (v - 1 + images.length) % images.length)
  const next = () => setI((v) => (v + 1) % images.length)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4" onClick={onClose}>
      <button className="absolute right-4 top-4 text-white/80 hover:text-white" onClick={onClose} aria-label="Cerrar">
        <X size={28} />
      </button>
      {images.length > 1 && (
        <button
          className="absolute left-3 text-white/70 hover:text-white sm:left-6"
          onClick={(e) => { e.stopPropagation(); prev() }}
          aria-label="Anterior"
        >
          <ChevronLeft size={40} />
        </button>
      )}
      <img
        src={images[i]}
        alt={`imagen ${i + 1}`}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <button
          className="absolute right-3 text-white/70 hover:text-white sm:right-6"
          onClick={(e) => { e.stopPropagation(); next() }}
          aria-label="Siguiente"
        >
          <ChevronRight size={40} />
        </button>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-4 rounded-full bg-ink/70 px-3 py-1 text-sm font-semibold text-white">
          {i + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
