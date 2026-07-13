import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Cliente Supabase. Se activa el "modo nube" solo si estan definidas las
// variables de entorno (.env). Sin ellas, la app funciona en modo local
// (localStorage) sin login. Ver README.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isCloud = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isCloud
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
