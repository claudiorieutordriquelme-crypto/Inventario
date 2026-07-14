import { useSyncExternalStore } from 'react'
import type { Database } from './types'
import { buildSeed } from './seed'
import { supabase, isCloud } from './supabase'

// -------------------------------------------------------------------------
// Capa de datos con dos modos:
//
//  - LOCAL (sin .env de Supabase): persiste en localStorage, sin login.
//  - NUBE  (con .env de Supabase): hidrata desde Supabase al iniciar sesion
//    y sincroniza cada cambio (upsert/delete por diff). Multiusuario con RLS.
//
// La UI no distingue el modo: lee via useDb(selector) y escribe via las
// funciones de dominio (inventory.ts / funnel.ts), que solo llaman a setState.
// -------------------------------------------------------------------------

const STORAGE_KEY = 'artesania-manager:db:v1'

// Tablas de entidades. El nombre coincide con la clave del objeto Database y
// con la tabla en Supabase (ver supabase/migrations/0001_schema.sql).
const TABLES: (keyof Database)[] = [
  'materials',
  'products',
  'movements',
  'customers',
  'stages',
  'orders',
  'designs',
  'posts',
]

function emptyDb(): Database {
  return {
    materials: [], products: [], movements: [], customers: [],
    stages: [], orders: [], designs: [], posts: [],
  }
}

function loadLocal(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Database
  } catch {
    // corrupto o no disponible: se regenera desde seed
  }
  const seed = buildSeed()
  persistLocal(seed)
  return seed
}

function persistLocal(db: Database) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // sin persistencia disponible; se mantiene en memoria
  }
}

// En modo nube arranca vacio hasta que AuthGate llame a initCloud().
let state: Database = isCloud ? emptyDb() : loadLocal()
let currentUserId: string | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getState(): Database {
  return state
}

// Actualiza el estado, notifica a la UI y (en nube) sincroniza el diff.
export function setState(producer: (draft: Database) => Database) {
  const prev = state
  const next = producer(prev)
  state = next
  emit()
  if (isCloud && currentUserId) {
    void syncDiff(prev, next)
  } else if (!isCloud) {
    persistLocal(next)
  }
}

export function useDb<T>(selector: (db: Database) => T): T {
  // El snapshot es el `state` (referencia estable, solo cambia al mutar). El
  // selector se aplica afuera para no crear un valor nuevo en cada llamada de
  // getSnapshot, lo que provocaria un loop infinito en useSyncExternalStore.
  const db = useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  )
  return selector(db)
}

export function resetDb() {
  if (isCloud) return // en nube no se resetea con seed local
  state = buildSeed()
  persistLocal(state)
  emit()
}

export function uid(prefix: string): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${rnd}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

// ---------------------------- Modo nube ----------------------------------

interface Identifiable {
  id: string
}

// Sincroniza los cambios entre dos estados hacia Supabase (upsert + delete).
async function syncDiff(prev: Database, next: Database) {
  if (!supabase || !currentUserId) return
  for (const table of TABLES) {
    const prevArr = prev[table] as unknown as Identifiable[]
    const nextArr = next[table] as unknown as Identifiable[]
    const prevMap = new Map(prevArr.map((o) => [o.id, o]))
    const nextIds = new Set(nextArr.map((o) => o.id))

    // Filas nuevas o modificadas
    const upserts = nextArr
      .filter((o) => {
        const before = prevMap.get(o.id)
        return !before || JSON.stringify(before) !== JSON.stringify(o)
      })
      .map((o) => ({ id: o.id, owner: currentUserId, data: o }))

    // Filas eliminadas
    const deletes = prevArr.filter((o) => !nextIds.has(o.id)).map((o) => o.id)

    try {
      if (upserts.length) {
        const { error } = await supabase.from(table).upsert(upserts)
        if (error) console.error(`Sync upsert ${table}:`, error.message)
      }
      if (deletes.length) {
        const { error } = await supabase.from(table).delete().in('id', deletes)
        if (error) console.error(`Sync delete ${table}:`, error.message)
      }
    } catch (e) {
      console.error(`Sync ${table}:`, e)
    }
  }
}

// Descarga los datos del usuario. Si la cuenta esta vacia, siembra datos de
// ejemplo (equivalente al primer arranque en local).
export async function initCloud(userId: string): Promise<void> {
  if (!supabase) return
  currentUserId = userId

  const fetched = emptyDb()
  let total = 0
  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('data')
    if (error) {
      console.error(`Carga ${table}:`, error.message)
      continue
    }
    const rows = (data ?? []).map((r) => (r as { data: unknown }).data)
    ;(fetched[table] as unknown[]) = rows
    total += rows.length
  }

  if (total === 0) {
    // Cuenta nueva: sembrar demo y empujarla a la nube.
    const seed = buildSeed()
    state = seed
    emit()
    await syncDiff(emptyDb(), seed)
  } else {
    state = fetched
    emit()
  }
}

export function clearCloudSession() {
  currentUserId = null
  state = emptyDb()
  emit()
}
