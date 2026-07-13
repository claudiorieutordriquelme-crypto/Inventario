import { type ReactNode, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { isCloud } from '@/lib/supabase'
import { useSession } from '@/lib/auth'
import { initCloud } from '@/lib/store'
import { LoginScreen } from './LoginScreen'

// Puerta de acceso. En modo local deja pasar directo. En modo nube exige
// sesion y espera a que se hidraten los datos del usuario.
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()
  const [ready, setReady] = useState(!isCloud)

  const userId = session?.user?.id

  useEffect(() => {
    if (!isCloud) return
    if (userId) {
      setReady(false)
      initCloud(userId).then(() => setReady(true))
    } else {
      setReady(false)
    }
  }, [userId])

  if (!isCloud) return <>{children}</>

  if (loading) return <Splash text="Iniciando..." />
  if (!session) return <LoginScreen />
  if (!ready) return <Splash text="Cargando tus datos..." />
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
