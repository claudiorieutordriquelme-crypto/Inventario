import { X } from 'lucide-react'
import { isPlayableVideo } from '@/lib/image'

// Reproduce un video .mp4/.webm en un overlay. Para links de YouTube/Instagram/
// TikTok (que no permiten embed directo simple), abre en una pestana nueva.
export function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  if (!url) return null

  if (!isPlayableVideo(url)) {
    window.open(url, '_blank')
    onClose()
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4" onClick={onClose}>
      <button className="absolute right-4 top-4 text-white/80 hover:text-white" onClick={onClose} aria-label="Cerrar">
        <X size={28} />
      </button>
      <video
        src={url}
        controls
        autoPlay
        className="max-h-[85vh] max-w-[90vw] rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
