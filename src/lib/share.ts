// Utilidades para compartir en redes. Usa Web Share API cuando esta
// disponible (movil / navegadores modernos) y cae a deep links por red.

export interface SharePayload {
  titulo: string
  texto: string
  url?: string
}

export async function compartir(p: SharePayload): Promise<'nativo' | 'copiado' | 'fallback'> {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
  if (nav.share) {
    try {
      await nav.share({ title: p.titulo, text: p.texto, url: p.url })
      return 'nativo'
    } catch {
      // usuario cancelo o no permitido: seguir a fallback
    }
  }
  try {
    await navigator.clipboard.writeText(`${p.texto}${p.url ? ' ' + p.url : ''}`)
    return 'copiado'
  } catch {
    return 'fallback'
  }
}

export function linkWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`
}

// Instagram y TikTok no permiten prellenar texto por URL; se abre la app/web
// para publicar manualmente. El texto queda copiado al portapapeles.
export const INSTAGRAM_URL = 'https://www.instagram.com/'
export const TIKTOK_URL = 'https://www.tiktok.com/upload'
