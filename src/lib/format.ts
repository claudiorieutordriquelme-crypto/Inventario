// Utilidades de formato para Chile (CLP, fechas es-CL).

export function clp(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0))
}

export function num(value: number): string {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(value || 0)
}

export function fecha(iso: string | null): string {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function fechaCorta(iso: string | null): string {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit' }).format(
    new Date(iso),
  )
}

// Dias entre dos fechas (b - a), redondeado.
export function diasEntre(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime()
  const b = new Date(bIso).getTime()
  return Math.round((b - a) / 86400000)
}

// Dias desde hoy hasta la fecha (negativo si ya paso).
export function diasHasta(iso: string | null): number | null {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}
