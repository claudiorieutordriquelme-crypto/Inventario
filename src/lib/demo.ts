import type {
  CatalogDesign,
  CommunityPost,
  Customer,
  Material,
  Order,
  Product,
  ProjectIdea,
  StockMovement,
} from './types'
import { setState, uid, nowIso } from './store'

// Carga UN ejemplo coherente en cada seccion (insumo, producto, cliente, pedido,
// movimiento, diseno de catalogo, publicacion e idea de manufactura), enlazados
// entre si. Pensado para poblar rapido una cuenta y demostrar la app.
export function cargarEjemplos() {
  setState((db) => {
    const at = nowIso()
    const matId = uid('mat')
    const prodId = uid('prod')
    const cusId = uid('cus')
    const stageId = db.stages.find((s) => !s.esGanada)?.id ?? db.stages[0]?.id ?? ''
    const fecha = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
    const fechaIso = new Date(`${fecha}T12:00:00`).toISOString()

    const material: Material = {
      id: matId, nombre: 'Lana merino (ejemplo)', categoria: 'lana', unidad: 'ovillo',
      stockActual: 10, stockMinimo: 8, costoUnitario: 3500, leadTimeDias: 7,
      proveedor: 'Proveedor ejemplo', createdAt: at,
    }
    const product: Product = {
      id: prodId, nombre: 'Amigurumi conejo (ejemplo)', tipo: 'crochet', sku: 'EJ-001',
      precio: 15900, stock: 3, fotoUrl: '', imagenes: [], catalogoPublico: true,
      bom: [{ materialId: matId, cantidad: 2 }], descripcion: 'Producto de ejemplo tejido a mano',
      diasEntrega: 7, createdAt: at,
    }
    const customer: Customer = {
      id: cusId, nombre: 'Cliente ejemplo', telefono: '+56 9 1234 5678',
      email: 'cliente@ejemplo.cl', canal: 'Instagram', createdAt: at,
    }
    const order: Order = {
      id: uid('ord'), customerId: cusId, titulo: 'Pedido de ejemplo', stageId, monto: 15900,
      productos: [{ productId: prodId, cantidad: 1 }], createdAt: at, fechaComprometida: fechaIso,
      entregadoAt: null, historial: [{ stageId, at }], notas: 'Pedido de demostracion',
    }
    const movement: StockMovement = {
      id: uid('mov'), fecha: at, tipo: 'entrada', itemKind: 'material', itemId: matId,
      cantidad: 10, motivo: 'Carga inicial (ejemplo)', usuario: 'admin',
    }
    const idea: ProjectIdea = {
      id: uid('idea'), titulo: 'Idea de ejemplo', descripcion: 'Nueva idea en desarrollo',
      stage: 'diseno', prioridad: 'media', notas: '', bom: [{ materialId: matId, cantidad: 1 }],
      precioEstimado: 12900, createdAt: at,
    }
    const design: CatalogDesign = {
      id: uid('des'), titulo: 'Diseno de ejemplo', descripcion: 'Patron para compartir',
      tags: ['crochet', 'ejemplo'], imagenUrl: '', textoCompartir: 'Mira este diseno tejido a mano!',
      createdAt: at,
    }
    const post: CommunityPost = {
      id: uid('post'), autor: 'Equipo', contenido: 'Publicacion de ejemplo en la comunidad. Comparte tus avances!',
      imagenUrl: '', likes: 3, createdAt: at,
    }

    return {
      ...db,
      materials: [...db.materials, material],
      products: [...db.products, product],
      customers: [...db.customers, customer],
      orders: [...db.orders, order],
      movements: [movement, ...db.movements],
      ideas: [...db.ideas, idea],
      designs: [...db.designs, design],
      posts: [...db.posts, post],
    }
  })
}
