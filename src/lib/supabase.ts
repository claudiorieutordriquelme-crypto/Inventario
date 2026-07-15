import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Credenciales del proyecto Supabase.
//
// Se fijan directamente en el codigo a proposito: la URL y la publishable/anon
// key son PUBLICAS por diseno (viajan en el bundle del navegador de todas formas)
// y quien protege los datos es Row Level Security. Fijarlas evita fallas por
// variables de entorno mal cargadas en el host. La service_role NUNCA va aqui.
//
// Nota: una variable de entorno solo se usa si trae una key con formato valido
// (sb_... o JWT eyJ...); cualquier otro valor se ignora y se usa el default.
const DEFAULT_URL = 'https://kooakxslqzevppvoflqg.supabase.co'
const DEFAULT_ANON_KEY = 'sb_publishable_jru_Fc3lPMGxM-OwmAC5lg_epELm00v'

function pick(envVal: string | undefined, def: string, valido: (v: string) => boolean): string {
  const v = (envVal ?? '').trim()
  return valido(v) ? v : def
}

const url = pick(import.meta.env.VITE_SUPABASE_URL as string | undefined, DEFAULT_URL, (v) =>
  /^https:\/\/.+\.supabase\.co\/?$/.test(v),
)
const anonKey = pick(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined, DEFAULT_ANON_KEY, (v) =>
  v.startsWith('sb_') || v.startsWith('eyJ'),
)

export const isCloud = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isCloud
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
