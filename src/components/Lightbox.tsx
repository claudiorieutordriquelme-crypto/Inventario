import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

// Visor de galeria a pantalla completa con transiciones y swipe (arrastrar).
export function Lightbox({
  images,
  start = 0,
  onClose,
}: {
  images: string[]
  start?: number
  onClose: () => void
}) {
  const [[i, dir], setI] = useState<[number, number]>([start, 0])

  const paso = (delta: number) =>
    setI(([v]) => [(v + delta + images.length) % images.length, delta])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') paso(1)
      if (e.key === 'ArrowLeft') paso(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length, onClose])

  if (!images.length) return null

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button className="absolute right-4 top-4 z-10 text-white/80 hover:text-white" onClick={onClose} aria-label="Cerrar">
        <X size={28} />
      </button>
      {images.length > 1 && (
        <button
          className="absolute left-3 z-10 text-white/70 hover:text-white sm:left-6"
          onClick={(e) => { e.stopPropagation(); paso(-1) }}
          aria-label="Anterior"
        >
          <ChevronLeft size={40} />
        </button>
      )}

      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.img
            key={i}
            src={images[i]}
            alt={`imagen ${i + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            custom={dir}
            initial={{ opacity: 0, x: dir >= 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir >= 0 ? -60 : 60 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            drag={images.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) paso(1)
              else if (info.offset.x > 80) paso(-1)
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <button
          className="absolute right-3 z-10 text-white/70 hover:text-white sm:right-6"
          onClick={(e) => { e.stopPropagation(); paso(1) }}
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
    </motion.div>
  )
}
