// Modelo de dominio. Estas interfaces reflejan las tablas planificadas para
// Supabase (ver README), de modo que migrar la capa local a la nube no obligue
// a reescribir la UI.

export type MaterialCategory = 'lana' | 'hilo' | 'tela' | 'tinta' | 'insumo'
export type ProductType = 'crochet' | 'estampado' | 'otro'

export interface Material {
  id: string
  nombre: string
  categoria: MaterialCategory
  unidad: string // ej: "ovillo", "metro", "unidad"
  stockActual: number
  stockMinimo: number
  costoUnitario: number // CLP
  leadTimeDias: number
  proveedor: string
  createdAt: string
}

export interface BomItem {
  materialId: string
  cantidad: number // consumo por unidad de producto
}

export interface Product {
  id: string
  nombre: string
  tipo: ProductType
  sku: string
  precio: number // CLP
  stock: number
  fotoUrl: string // portada (compat). Se mantiene sincronizada con imagenes[0].
  imagenes?: string[] // galeria del producto (varias fotos). La primera es la portada.
  videoUrl?: string // link a video breve (YouTube, Instagram, TikTok o .mp4)
  descripcion?: string // descripcion breve del producto
  catalogoPublico: boolean
  bom: BomItem[]
  diasEntrega?: number // tiempo de entrega por encargo (dias). Opcional.
  createdAt: string
}

export type MovementType = 'entrada' | 'salida' | 'produccion' | 'venta' | 'ajuste'

export interface StockMovement {
  id: string
  fecha: string
  tipo: MovementType
  // referencia al item afectado
  itemKind: 'material' | 'product'
  itemId: string
  cantidad: number // positivo entrada, negativo salida
  motivo: string
  usuario: string
}

export interface Customer {
  id: string
  nombre: string
  telefono: string
  email: string
  canal: string // ej: Instagram, TikTok, WhatsApp, Feria
  createdAt: string
}

// Etapas del funnel. `orden` define la posicion en el kanban.
export interface Stage {
  id: string
  nombre: string
  orden: number
  esGanada: boolean // true en la etapa final "Entregado"
}

export interface Order {
  id: string
  customerId: string
  titulo: string
  stageId: string
  monto: number // CLP
  productos: { productId: string; cantidad: number }[]
  createdAt: string
  fechaComprometida: string | null // fecha de entrega comprometida
  entregadoAt: string | null
  // historial de cambios de etapa para calcular cycle time por etapa
  historial: { stageId: string; at: string }[]
  notas: string
}

export interface CatalogDesign {
  id: string
  titulo: string
  descripcion: string
  tags: string[]
  imagenUrl: string
  textoCompartir: string
  createdAt: string
}

export interface CommunityPost {
  id: string
  autor: string
  contenido: string
  imagenUrl: string
  likes: number
  createdAt: string
}

// Planning tipo manufactura: ideas / productos en desarrollo por etapa.
export type IdeaStage = 'idea' | 'diseno' | 'prototipo' | 'produccion' | 'listo'
export type Prioridad = 'baja' | 'media' | 'alta'

export interface ProjectIdea {
  id: string
  titulo: string
  descripcion: string
  stage: IdeaStage
  prioridad: Prioridad
  notas: string
  productoCreado?: boolean // true cuando ya paso a Inventario como producto
  createdAt: string
}

export interface Database {
  materials: Material[]
  products: Product[]
  movements: StockMovement[]
  customers: Customer[]
  stages: Stage[]
  orders: Order[]
  designs: CatalogDesign[]
  posts: CommunityPost[]
  ideas: ProjectIdea[]
}
