import type { Database, Material, Product, BomItem } from './types'
import { setState, uid, nowIso } from './store'

// -------------------------------------------------------------------------
// Marco de gestion de inventario: Punto de Reorden (ROP).
// ROP = demanda_promedio_diaria * lead_time + stock_seguridad  (ASCM/APICS).
//
// En el MVP no tenemos demanda historica confiable, por lo que `stockMinimo`
// se fija manualmente y actua como umbral de alerta. Cuando exista historial
// de ventas se puede recalcular con `sugerirStockMinimo`.
// -------------------------------------------------------------------------

export type StockStatus = 'critico' | 'bajo' | 'ok'

export function stockStatus(m: Material): StockStatus {
  if (m.stockActual <= 0) return 'critico'
  if (m.stockActual <= m.stockMinimo) return 'bajo'
  return 'ok'
}

export function materialesEnAlerta(db: Database): Material[] {
  return db.materials
    .filter((m) => stockStatus(m) !== 'ok')
    .sort((a, b) => a.stockActual - b.stockActual)
}

// Sugerencia de stock minimo usando el marco ROP.
// factorSeguridad ~ 1.5 cubre variabilidad tipica en demanda intermitente.
export function sugerirStockMinimo(
  demandaDiaria: number,
  leadTimeDias: number,
  factorSeguridad = 1.5,
): number {
  const stockSeguridad = demandaDiaria * leadTimeDias * (factorSeguridad - 1)
  return Math.ceil(demandaDiaria * leadTimeDias + stockSeguridad)
}

// Costo de materiales de un producto segun su receta (BOM):
// suma de (cantidad usada x costo unitario del material).
export function costoProducto(materials: Material[], bom: BomItem[]): number {
  return bom.reduce((s, b) => {
    const m = materials.find((x) => x.id === b.materialId)
    return s + (m ? m.costoUnitario * b.cantidad : 0)
  }, 0)
}

// Lineas del BOM cuyo material ya no existe en inventario (fue eliminado o el id
// es invalido). Si hay faltantes, el costo esta subestimado y el margen NO es
// confiable: la UI debe advertirlo en vez de mostrar un margen inflado.
export function materialesFaltantes(materials: Material[], bom: BomItem[]): BomItem[] {
  return bom.filter((b) => !materials.some((m) => m.id === b.materialId))
}

// Cuenta cuantos productos e ideas referencian un material en su receta.
// Sirve para advertir antes de eliminar un insumo.
export function usosDeMaterial(db: Database, materialId: string): number {
  const enProductos = db.products.filter((p) => p.bom.some((b) => b.materialId === materialId)).length
  const enIdeas = db.ideas.filter((i) => (i.bom ?? []).some((b) => b.materialId === materialId)).length
  return enProductos + enIdeas
}

export interface MargenInfo {
  costo: number
  margenMonto: number // precio - costo
  margenPct: number // (precio - costo) / precio
}

export function margenProducto(materials: Material[], bom: BomItem[], precio: number): MargenInfo {
  const costo = costoProducto(materials, bom)
  const margenMonto = precio - costo
  const margenPct = precio > 0 ? margenMonto / precio : 0
  return { costo, margenMonto, margenPct }
}

// Precio sugerido para alcanzar un margen objetivo (%). Redondeado a $100.
export function precioSugerido(costo: number, margenObjetivoPct: number): number {
  const m = Math.min(Math.max(margenObjetivoPct, 0), 95) / 100
  if (costo <= 0) return 0
  return Math.round(costo / (1 - m) / 100) * 100
}

export function valorInventario(db: Database): number {
  const mat = db.materials.reduce((s, m) => s + m.stockActual * m.costoUnitario, 0)
  const prod = db.products.reduce((s, p) => s + p.stock * p.precio, 0)
  return mat + prod
}

// --- Mutaciones ---

export function addMaterial(input: Omit<Material, 'id' | 'createdAt'>) {
  setState((db) => ({
    ...db,
    materials: [...db.materials, { ...input, id: uid('mat'), createdAt: nowIso() }],
  }))
}

export function updateMaterial(id: string, patch: Partial<Material>) {
  setState((db) => ({
    ...db,
    materials: db.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  }))
}

export function deleteMaterial(id: string) {
  setState((db) => ({ ...db, materials: db.materials.filter((m) => m.id !== id) }))
}

export function addProduct(input: Omit<Product, 'id' | 'createdAt'>) {
  setState((db) => ({
    ...db,
    products: [...db.products, { ...input, id: uid('prod'), createdAt: nowIso() }],
  }))
}

export function updateProduct(id: string, patch: Partial<Product>) {
  setState((db) => ({
    ...db,
    products: db.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }))
}

export function deleteProduct(id: string) {
  setState((db) => ({ ...db, products: db.products.filter((p) => p.id !== id) }))
}

// Ajuste directo de stock de un material (entrada/salida/ajuste), con kardex.
export function ajustarStockMaterial(
  materialId: string,
  delta: number,
  tipo: 'entrada' | 'salida' | 'ajuste',
  motivo: string,
  usuario = 'admin',
) {
  setState((db) => ({
    ...db,
    materials: db.materials.map((m) =>
      m.id === materialId ? { ...m, stockActual: Math.max(0, m.stockActual + delta) } : m,
    ),
    movements: [
      {
        id: uid('mov'),
        fecha: nowIso(),
        tipo,
        itemKind: 'material' as const,
        itemId: materialId,
        cantidad: delta,
        motivo,
        usuario,
      },
      ...db.movements,
    ],
  }))
}

// Registrar produccion de un producto: sube stock del producto y descuenta
// insumos segun su BOM (receta). Genera movimientos de kardex.
export function registrarProduccion(productId: string, cantidad: number, usuario = 'admin') {
  setState((db) => {
    const product = db.products.find((p) => p.id === productId)
    if (!product || cantidad <= 0) return db

    const movimientos = [
      {
        id: uid('mov'), fecha: nowIso(), tipo: 'produccion' as const,
        itemKind: 'product' as const, itemId: productId, cantidad,
        motivo: `Produccion de ${cantidad} ${product.nombre}`, usuario,
      },
    ]

    const materials = db.materials.map((m) => {
      const bom = product.bom.find((b) => b.materialId === m.id)
      if (!bom) return m
      const consumo = bom.cantidad * cantidad
      movimientos.push({
        id: uid('mov'), fecha: nowIso(), tipo: 'produccion' as const,
        itemKind: 'product' as const, itemId: m.id, cantidad: -consumo,
        motivo: `Consumo por produccion de ${product.nombre}`, usuario,
      })
      return { ...m, stockActual: Math.max(0, m.stockActual - consumo) }
    })

    return {
      ...db,
      materials,
      products: db.products.map((p) =>
        p.id === productId ? { ...p, stock: p.stock + cantidad } : p,
      ),
      movements: [...movimientos, ...db.movements],
    }
  })
}
