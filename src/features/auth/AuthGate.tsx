import { type ReactNode, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { isCloud } from '@/lib/supabase'
import { initCloud } from '@/lib/store'

// Acceso directo (sin login). En modo nube, hidrata los datos compartidos al
// arrancar y muestra un loader mientras carga. En modo local pasa directo.
export function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isCloud)

  useEffect(() => {
    if (!isCloud) return
    initCloud()
      .then(() => setReady(true))
      .catch(() => setReady(true))
  }, [])

  if (!ready) return <Splash text="Cargando datos..." />
  return <>{children}</>
}

function Splash({ text }: { text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-ink-faint">
      <Loader2 className="animate-spin text-primary" size={28} />
      <p className="text-sm font-medium">{text}</p>
    </div>
  )
}
