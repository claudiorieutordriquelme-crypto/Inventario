// Contenido de ayuda contextual por seccion (ruta). Se muestra en el boton "?"
// de la barra superior segun donde este el usuario.
export interface HelpSection {
  titulo: string
  queHace: string
  pasos: string[]
  tips?: string[]
}

export const helpSections: Record<string, HelpSection> = {
  '/': {
    titulo: 'Dashboard',
    queHace:
      'Vista general del negocio: valor de inventario, pipeline de ventas, tiempo de ciclo, conversion, cumplimiento de plazo, ventas por mes, alertas de stock y proximas entregas.',
    pasos: [
      'Revisa los indicadores de arriba para tener el estado del negocio de un vistazo.',
      'Usa "Cargar datos de ejemplo" para poblar la app con un caso de cada seccion y explorar.',
      'Haz clic en "Ver tablero" o "Ir a inventario" para saltar a la seccion con detalle.',
    ],
    tips: ['Las cifras se actualizan solas a medida que registras insumos, productos y pedidos.'],
  },
  '/inventario': {
    titulo: 'Inventario',
    queHace:
      'Controla tus insumos (materia prima) y productos terminados. Calcula costo y margen, y avisa cuando el stock baja del minimo (punto de reorden).',
    pasos: [
      'Pestana Insumos: crea cada material con su unidad, costo, stock actual y stock minimo. El sistema alerta cuando queda bajo el minimo.',
      'Pestana Productos: crea el producto y define su receta (BOM): que insumos usa y en que cantidad. Veras el costo, el margen y un precio sugerido.',
      'Boton "Producir": al fabricar, sube el stock del producto y descuenta los insumos segun la receta.',
      'Pestana Movimientos: es el historial (kardex) de entradas, salidas, produccion y ventas.',
    ],
    tips: ['El margen no es confiable si la receta usa un insumo que borraste: aparece un aviso.'],
  },
  '/planning': {
    titulo: 'Planning',
    queHace:
      'Tablero de manufactura para tus ideas y productos en desarrollo, por etapas: Idea, Diseno, Prototipo, Produccion y Listo.',
    pasos: [
      'Crea una idea con "Nueva idea": titulo, prioridad, receta de insumos y precio estimado. Veras el costo y margen estimado.',
      'Avanza la idea de etapa con las flechas de la tarjeta.',
      'Al llegar a "Listo" se crea automaticamente el producto en Inventario, heredando su receta y precio (te pide confirmar).',
    ],
    tips: ['Editar una idea que ya paso a Inventario no modifica el producto ya creado.'],
  },
  '/funnel': {
    titulo: 'Funnel',
    queHace:
      'Dos embudos: Venta (pedidos por etapa, con tiempo de ciclo y conversion) y Manufactura (ideas en desarrollo). Muestra cantidad (Q) y monto ($) por etapa.',
    pasos: [
      'Pestana Venta: crea un pedido con "Nuevo pedido", elige cliente, productos y fecha de entrega. El monto se calcula solo.',
      'Haz clic en una etapa para ver sus pedidos; abre un pedido para editarlo o cambiarlo de etapa.',
      'Al mover un pedido a "Entregado" se rebaja el stock de los productos vendidos.',
      'Pestana Manufactura: es el mismo embudo pero de las ideas de Planning.',
    ],
    tips: ['El % entre etapas es la conversion respecto a la etapa anterior.'],
  },
  '/calendario': {
    titulo: 'Calendario de entregas',
    queHace:
      'Muestra los pedidos segun su fecha de entrega comprometida, para no atrasarte.',
    pasos: [
      'Vista Mes (micro): cada dia muestra sus pedidos. Pasa el mouse sobre un dia y usa el boton "+" para crear un pedido con esa fecha.',
      'Vista Ano (macro): resumen por mes con cantidad, monto y proporcion ya entregada.',
      'Haz clic en un pedido para editarlo. Los vencidos se marcan en naranja.',
    ],
  },
  '/clientes': {
    titulo: 'Clientes',
    queHace: 'Tu base de contactos, con el canal por el que te encontraron (Instagram, TikTok, feria, etc.).',
    pasos: [
      'Crea un cliente con "Nuevo cliente": nombre, telefono, email y canal.',
      'Cada cliente muestra cuantos pedidos tiene asociados.',
      'Al crear un pedido en el Funnel eliges a que cliente pertenece.',
    ],
  },
  '/catalogo': {
    titulo: 'Catalogo',
    queHace:
      'Tu vitrina de productos para vender por encargo. Puedes armar un link publico para compartir en Instagram, WhatsApp y TikTok.',
    pasos: [
      'Configura tu numero de WhatsApp (te lo pide arriba) para recibir los pedidos.',
      'En cada producto, boton "Fotos": sube hasta 6 imagenes, un video (link) y una descripcion.',
      'Marca el producto como publicado (icono de ojo) para que aparezca en el catalogo publico.',
      'Boton "Compartir catalogo": copia el link publico o compartelo por redes. Tus clientes lo abren sin iniciar sesion y te escriben por WhatsApp.',
    ],
    tips: ['El costo y el margen NUNCA se muestran en el catalogo publico, solo el precio.'],
  },
  '/comunidad': {
    titulo: 'Comunidad',
    queHace: 'Un espacio para compartir avances, patrones y novedades.',
    pasos: [
      'Escribe tu publicacion y, opcionalmente, pega el link de una foto.',
      'Publica con el boton "Publicar".',
      'Da "me gusta" con el corazon (se puede quitar volviendo a tocarlo).',
    ],
  },
}

// Ayuda por defecto para rutas sin entrada especifica (ej. catalogo publico).
export const helpFallback: HelpSection = {
  titulo: 'Ayuda',
  queHace: 'Esta seccion no tiene una guia especifica.',
  pasos: ['Usa el menu de la izquierda para navegar entre las secciones de la app.'],
}
