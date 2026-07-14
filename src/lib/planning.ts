import type { Database, IdeaStage, Product, ProjectIdea } from './types'
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

// Construye un producto de Inventario a partir de una idea, heredando su receta
// (BOM) y precio estimado. Guarda ideaId para enlazar y evitar duplicados.
function productoDesdeIdea(idea: Pick<ProjectIdea, 'id' | 'titulo' | 'descripcion' | 'bom' | 'precioEstimado'>): Product {
  return {
    id: uid('prod'),
    ideaId: idea.id,
    nombre: idea.titulo,
    tipo: 'otro',
    sku: '',
    precio: idea.precioEstimado ?? 0,
    stock: 0,
    fotoUrl: '',
    imagenes: [],
    catalogoPublico: false,
    bom: idea.bom ?? [],
    descripcion: idea.descripcion,
    diasEntrega: 7,
    createdAt: nowIso(),
  }
}

// Verdadero si la idea ya tiene un producto en Inventario (por marca o enlace).
function yaConvertida(db: Database, idea: ProjectIdea): boolean {
  return idea.productoCreado === true || db.products.some((p) => p.ideaId === idea.id)
}

export function addIdea(input: Omit<ProjectIdea, 'id' | 'createdAt'>) {
  setState((db) => {
    const id = uid('idea')
    const convertir = input.stage === 'listo'
    const idea = { ...input, id, createdAt: nowIso(), productoCreado: convertir }
    return {
      ...db,
      products: convertir ? [...db.products, productoDesdeIdea(idea)] : db.products,
      ideas: [...db.ideas, idea],
    }
  })
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

    const convertida = yaConvertida(db, idea)
    const convertir = stage === 'listo' && !convertida

    const products = convertir ? [...db.products, productoDesdeIdea(idea)] : db.products

    return {
      ...db,
      products,
      ideas: db.ideas.map((i) =>
        i.id === id ? { ...i, stage, productoCreado: convertida || convertir } : i,
      ),
    }
  })
}
