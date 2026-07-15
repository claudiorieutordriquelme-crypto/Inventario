import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Cliente Supabase (modo nube).
//
// Se toman las credenciales desde variables de entorno (.env / panel del host)
// y, si faltan, se usan los valores por defecto del proyecto. La publishable/anon
// key es PUBLICA por diseno (viaja en el bundle del navegador de todas formas);
// quien protege los datos es Row Level Security. La service_role NUNCA va aqui.
const DEFAULT_URL = 'https://kooakxslqzevppvoflqg.supabase.co'
const DEFAULT_ANON_KEY = 'sb_publishable_jru_Fc3lPMGxM-OwmAC5lg_epELm00v'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_ANON_KEY

export const isCloud = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isCloud
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
