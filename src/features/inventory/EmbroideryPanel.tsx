import { useRef, useState } from 'react'
import { Upload, Trash2, Palette } from 'lucide-react'
import { Field } from '@/components/ui'
import { clp, num } from '@/lib/format'
import { parseDst, costoBordado, type DstResult } from '@/lib/dst'

interface BordadoValue {
  costoBordado?: number
  bordadoMetros?: number
  bordadoPuntadas?: number
}

// Panel de bordado (PoC): sube un .DST, calcula metros de hilo por color y el
// costo estimado, y lo reporta al producto para sumarlo al costo/margen.
export function EmbroideryPanel({
  value,
  onChange,
}: {
  value: BordadoValue
  onChange: (patch: BordadoValue) => void
}) {
  const [result, setResult] = useState<DstResult | null>(null)
  const [precioMetro, setPrecioMetro] = useState(15)
  const [factor, setFactor] = useState(1.3)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const aplicar = (res: DstResult, pm: number, f: number) => {
    onChange({
      costoBordado: costoBordado(res.metros, pm, f),
      bordadoMetros: Math.round(res.metros * 10) / 10,
      bordadoPuntadas: res.puntadas,
    })
  }

  const onFile = async (file: File) => {
    setError('')
    try {
      const res = parseDst(await file.arrayBuffer())
      if (res.puntadas === 0) {
        setError('No se detectaron puntadas. Verifica que sea un archivo .DST valido.')
        return
      }
      setResult(res)
      aplicar(res, precioMetro, factor)
    } catch {
      setError('No se pudo leer el archivo .DST.')
    }
  }

  const setPrecio = (v: number) => {
    setPrecioMetro(v)
    if (result) aplicar(result, v, factor)
  }
  const setFac = (v: number) => {
    setFactor(v)
    if (result) aplicar(result, precioMetro, v)
  }
  const quitar = () => {
    setResult(null)
    onChange({ costoBordado: 0, bordadoMetros: 0, bordadoPuntadas: 0 })
  }

  return (
    <div className="rounded-lg border border-surface-border p-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Palette size={15} /> Bordado (opcional)
        </p>
        {(value.costoBordado ?? 0) > 0 && (
          <button type="button" className="btn-ghost !p-1 text-accent" title="Quitar bordado" onClick={quitar}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <p className="mt-0.5 text-xs text-ink-faint">
        Sube el archivo .DST del diseno; calcula los metros de hilo por color y suma el costo al producto.
      </p>

      <button type="button" className="btn-outline mt-3 w-full !py-1.5 text-xs" onClick={() => fileRef.current?.click()}>
        <Upload size={14} /> Subir archivo .DST
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".dst"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {error && <p className="mt-2 text-xs font-medium text-accent">{error}</p>}

      {result && (
        <>
          <div className="mt-3 overflow-hidden rounded-lg border border-surface-border">
            <div className="flex items-center gap-3 bg-surface-muted px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              <span className="flex-1">Color</span>
              <span className="w-16 text-right">Puntadas</span>
              <span className="w-20 text-right">Metros</span>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {result.segmentos.map((s) => (
                <div key={s.color} className="flex items-center gap-3 px-3 py-1.5 text-sm">
                  <span className="flex-1 text-ink-soft">Color {s.color}</span>
                  <span className="w-16 text-right text-ink-soft">{s.puntadas}</span>
                  <span className="w-20 text-right font-semibold text-ink">{num(s.metros)} m</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 border-t border-surface-border px-3 py-1.5 text-sm">
              <span className="flex-1 font-bold text-ink">Total ({result.segmentos.length} colores)</span>
              <span className="w-16 text-right font-bold text-ink">{result.puntadas}</span>
              <span className="w-20 text-right font-extrabold text-ink">{num(result.metros)} m</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Precio hilo (CLP/m)">
              <input type="number" step="0.1" className="input" value={precioMetro} onChange={(e) => setPrecio(Number(e.target.value))} />
            </Field>
            <Field label="Factor (tension+bobina)">
              <input type="number" step="0.05" className="input" value={factor} onChange={(e) => setFac(Number(e.target.value))} />
            </Field>
          </div>
        </>
      )}

      {(value.costoBordado ?? 0) > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary-50 px-3 py-2">
          <span className="text-sm text-ink-soft">
            Costo bordado{value.bordadoMetros ? ` (${num(value.bordadoMetros)} m)` : ''}
          </span>
          <span className="text-sm font-extrabold text-ink">{clp(value.costoBordado ?? 0)}</span>
        </div>
      )}
    </div>
  )
}
