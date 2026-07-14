import type { Database } from './types'

// Datos de ejemplo para que la app arranque con contenido demostrable.
// Se cargan solo la primera vez; luego persiste lo que el usuario edite.
const now = new Date()
const iso = (offsetDays: number) =>
  new Date(now.getTime() + offsetDays * 86400000).toISOString()

export function buildSeed(): Database {
  const stages = [
    { id: 'st-lead', nombre: 'Lead', orden: 0, esGanada: false },
    { id: 'st-cotiz', nombre: 'Cotizacion', orden: 1, esGanada: false },
    { id: 'st-conf', nombre: 'Confirmado', orden: 2, esGanada: false },
    { id: 'st-prod', nombre: 'En produccion', orden: 3, esGanada: false },
    { id: 'st-listo', nombre: 'Listo', orden: 4, esGanada: false },
    { id: 'st-entrega', nombre: 'Entregado', orden: 5, esGanada: true },
    { id: 'st-post', nombre: 'Postventa', orden: 6, esGanada: false },
  ]

  const materials = [
    {
      id: 'mat-1', nombre: 'Lana merino natural', categoria: 'lana' as const, unidad: 'ovillo',
      stockActual: 4, stockMinimo: 8, costoUnitario: 3500, leadTimeDias: 7,
      proveedor: 'Lanas del Sur', createdAt: iso(-30),
    },
    {
      id: 'mat-2', nombre: 'Hilo algodon 8/4', categoria: 'hilo' as const, unidad: 'cono',
      stockActual: 15, stockMinimo: 6, costoUnitario: 5200, leadTimeDias: 10,
      proveedor: 'Textil Andes', createdAt: iso(-30),
    },
    {
      id: 'mat-3', nombre: 'Polera algodon blanca', categoria: 'tela' as const, unidad: 'unidad',
      stockActual: 22, stockMinimo: 20, costoUnitario: 2800, leadTimeDias: 5,
      proveedor: 'Importadora Prendas', createdAt: iso(-20),
    },
    {
      id: 'mat-4', nombre: 'Tinta textil plastisol negra', categoria: 'tinta' as const, unidad: 'litro',
      stockActual: 1, stockMinimo: 3, costoUnitario: 12000, leadTimeDias: 14,
      proveedor: 'InsumoSerigrafia', createdAt: iso(-15),
    },
  ]

  const products = [
    {
      id: 'prod-1', nombre: 'Amigurumi conejo', tipo: 'crochet' as const, sku: 'CRO-001',
      precio: 15900, stock: 3, fotoUrl: '', catalogoPublico: true, diasEntrega: 7,
      bom: [{ materialId: 'mat-1', cantidad: 2 }], createdAt: iso(-25),
    },
    {
      id: 'prod-2', nombre: 'Chaleco tejido a mano', tipo: 'crochet' as const, sku: 'CRO-002',
      precio: 39900, stock: 1, fotoUrl: '', catalogoPublico: true, diasEntrega: 21,
      bom: [{ materialId: 'mat-2', cantidad: 3 }], createdAt: iso(-20),
    },
    {
      id: 'prod-3', nombre: 'Polera estampada logo', tipo: 'estampado' as const, sku: 'EST-001',
      precio: 12900, stock: 8, fotoUrl: '', catalogoPublico: false, diasEntrega: 5,
      bom: [{ materialId: 'mat-3', cantidad: 1 }, { materialId: 'mat-4', cantidad: 0.05 }],
      createdAt: iso(-10),
    },
  ]

  const customers = [
    { id: 'cus-1', nombre: 'Camila Rojas', telefono: '+56 9 8123 4567', email: 'camila@example.cl', canal: 'Instagram', createdAt: iso(-18) },
    { id: 'cus-2', nombre: 'Feria Barrio Italia', telefono: '+56 9 7000 1111', email: 'ferias@example.cl', canal: 'Feria', createdAt: iso(-12) },
    { id: 'cus-3', nombre: 'Diego Fuentes', telefono: '+56 9 6222 3333', email: 'diego@example.cl', canal: 'TikTok', createdAt: iso(-6) },
    { id: 'cus-4', nombre: 'Valentina Soto', telefono: '+56 9 5333 4444', email: 'vale@example.cl', canal: 'WhatsApp', createdAt: iso(-2) },
  ]

  const orders = [
    {
      id: 'ord-1', customerId: 'cus-1', titulo: 'Set 3 amigurumis', stageId: 'st-prod',
      monto: 47700, productos: [{ productId: 'prod-1', cantidad: 3 }],
      createdAt: iso(-9), fechaComprometida: iso(1), entregadoAt: null,
      historial: [{ stageId: 'st-lead', at: iso(-9) }, { stageId: 'st-cotiz', at: iso(-8) }, { stageId: 'st-conf', at: iso(-6) }, { stageId: 'st-prod', at: iso(-4) }],
      notas: 'Colores pastel',
    },
    {
      id: 'ord-2', customerId: 'cus-3', titulo: '10 poleras evento', stageId: 'st-cotiz',
      monto: 129000, productos: [{ productId: 'prod-3', cantidad: 10 }],
      createdAt: iso(-5), fechaComprometida: iso(6), entregadoAt: null,
      historial: [{ stageId: 'st-lead', at: iso(-5) }, { stageId: 'st-cotiz', at: iso(-4) }],
      notas: 'Requiere logo vectorizado',
    },
    {
      id: 'ord-3', customerId: 'cus-2', titulo: 'Chaleco encargo', stageId: 'st-entrega',
      monto: 39900, productos: [{ productId: 'prod-2', cantidad: 1 }],
      createdAt: iso(-16), fechaComprometida: iso(-3), entregadoAt: iso(-3),
      historial: [{ stageId: 'st-lead', at: iso(-16) }, { stageId: 'st-conf', at: iso(-14) }, { stageId: 'st-prod', at: iso(-10) }, { stageId: 'st-listo', at: iso(-5) }, { stageId: 'st-entrega', at: iso(-3) }],
      notas: '',
    },
    {
      id: 'ord-4', customerId: 'cus-4', titulo: 'Amigurumi personalizado', stageId: 'st-listo',
      monto: 18900, productos: [{ productId: 'prod-1', cantidad: 1 }],
      createdAt: iso(-4), fechaComprometida: iso(0), entregadoAt: null,
      historial: [{ stageId: 'st-lead', at: iso(-4) }, { stageId: 'st-conf', at: iso(-3) }, { stageId: 'st-prod', at: iso(-2) }, { stageId: 'st-listo', at: iso(-1) }],
      notas: 'Entrega hoy',
    },
  ]

  const designs = [
    { id: 'des-1', titulo: 'Amigurumi conejo pastel', descripcion: 'Patron tierno ideal para regalo', tags: ['crochet', 'amigurumi', 'regalo'], imagenUrl: '', textoCompartir: 'Nuevo amigurumi conejo disponible por encargo! Escribenos por DM.', createdAt: iso(-8) },
    { id: 'des-2', titulo: 'Polera estampado minimal', descripcion: 'Estampado de una tinta, look urbano', tags: ['estampado', 'urbano'], imagenUrl: '', textoCompartir: 'Poleras estampadas personalizadas, pide la tuya!', createdAt: iso(-5) },
  ]

  const posts = [
    { id: 'post-1', autor: 'Equipo', contenido: 'Bienvenidos a la comunidad! Comparte tus avances de la semana.', imagenUrl: '', likes: 5, createdAt: iso(-3) },
    { id: 'post-2', autor: 'Camila R.', contenido: 'Termine mi primer amigurumi siguiendo el patron del catalogo.', imagenUrl: '', likes: 12, createdAt: iso(-1) },
  ]

  const ideas = [
    { id: 'idea-1', titulo: 'Coleccion navidad', descripcion: 'Amigurumis tematicos: reno, muneco de nieve', stage: 'idea' as const, prioridad: 'alta' as const, notas: 'Lanzar en noviembre', createdAt: iso(-4) },
    { id: 'idea-2', titulo: 'Gorro con trenzas', descripcion: 'Nuevo patron de gorro', stage: 'diseno' as const, prioridad: 'media' as const, notas: '', createdAt: iso(-3) },
    { id: 'idea-3', titulo: 'Tote bag estampada', descripcion: 'Bolsa de algodon con estampado propio', stage: 'prototipo' as const, prioridad: 'media' as const, notas: 'Probar tinta al agua', createdAt: iso(-2) },
  ]

  return { materials, products, movements: [], customers, stages, orders, designs, posts, ideas }
}
