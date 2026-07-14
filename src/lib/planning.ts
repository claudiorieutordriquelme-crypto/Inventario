import type { Database, IdeaStage, ProjectIdea } from './types'
import { setState, uid, nowIso } from './store'

// Planning tipo manufactura: pipeline de ideas / productos en desarrollo.
export const IDEA_STAGES: { id: IdeaStage; label: string }[] = [
  { id: 'idea', label: 'Idea' },
  { id: 'diseno', label: 'Diseno' },
  { id: 'prototipo', label: 'Prototipo' },
  { id: 'produccion', label: 'Produccion' },
  { id: 'listo', label: 'Listo' },
]

export function ideasPorStage(db: Database, stage: IdeaStage): ProjectIdea[] {
  return db.ideas.filter((i) => i.stage === stage)
}

export function addIdea(input: Omit<ProjectIdea, 'id' | 'createdAt'>) {
  setState((db) => ({
    ...db,
    ideas: [...db.ideas, { ...input, id: uid('idea'), createdAt: nowIso() }],
  }))
}

export function updateIdea(id: string, patch: Partial<ProjectIdea>) {
  setState((db) => ({
    ...db,
    ideas: db.ideas.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  }))
}

export function deleteIdea(id: string) {
  setState((db) => ({ ...db, ideas: db.ideas.filter((i) => i.id !== id) }))
}

// Mueve una idea de etapa. Al entrar por primera vez a "listo", la convierte
// automaticamente en producto de Inventario (precio y stock en 0 para completar).
export function moverIdea(id: string, stage: IdeaStage) {
  setState((db) => {
    const idea = db.ideas.find((i) => i.id === id)
    if (!idea || idea.stage === stage) return db

    const convertir = stage === 'listo' && !idea.productoCreado

    const products = convertir
      ? [
          ...db.products,
          {
            id: uid('prod'),
            nombre: idea.titulo,
            tipo: 'otro' as const,
            sku: '',
            precio: 0,
            stock: 0,
            fotoUrl: '',
            imagenes: [],
            catalogoPublico: false,
            bom: [],
            descripcion: idea.descripcion,
            diasEntrega: 7,
            createdAt: nowIso(),
          },
        ]
      : db.products

    return {
      ...db,
      products,
      ideas: db.ideas.map((i) =>
        i.id === id ? { ...i, stage, productoCreado: i.productoCreado || convertir } : i,
      ),
    }
  })
}
