import { useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, Pencil, CheckCircle2 } from 'lucide-react'
import { useDb } from '@/lib/store'
import type { BomItem, ProjectIdea, IdeaStage, Prioridad } from '@/lib/types'
import { SectionTitle, Badge, Modal, Field, EmptyState } from '@/components/ui'
import { BomEditor } from '@/components/BomEditor'
import { IDEA_STAGES, ideasPorStage, addIdea, updateIdea, deleteIdea, moverIdea } from '@/lib/planning'
import { costoProducto, margenProducto, precioSugerido } from '@/lib/inventory'
import { clp, num } from '@/lib/format'

const prioridadTone: Record<Prioridad, 'accent' | 'primary' | 'neutral'> = {
  alta: 'accent',
  media: 'primary',
  baja: 'neutral',
}

export function PlanningPage() {
  const db = useDb((d) => d)
  const [editing, setEditing] = useState<ProjectIdea | null>(null)
  const [creating, setCreating] = useState(false)

  const stageIndex = (s: IdeaStage) => IDEA_STAGES.findIndex((x) => x.id === s)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Planning" sub="Ideas y productos en desarrollo (al llegar a Listo pasan a Inventario)" />
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> Nueva idea
        </button>
      </div>

      {db.ideas.length === 0 ? (
        <EmptyState title="Sin ideas en desarrollo" hint="Agrega una idea y muevela por las etapas de manufactura." />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {IDEA_STAGES.map((s) => {
            const ideas = ideasPorStage(db, s.id)
            return (
              <div key={s.id} className="flex w-64 shrink-0 flex-col">
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className={`h-2 w-2 rounded-full ${s.id === 'listo' ? 'bg-secondary' : 'bg-primary'}`} />
                  <span className="text-sm font-bold text-ink">{s.label}</span>
                  <Badge tone="neutral">{ideas.length}</Badge>
                </div>
                <div className="flex flex-1 flex-col gap-2 rounded-xl bg-surface-muted p-2">
                  {ideas.length === 0 && <p className="px-2 py-4 text-center text-xs text-ink-faint">Vacio</p>}
                  {ideas.map((idea) => {
                    const idx = stageIndex(idea.stage)
                    return (
                      <div key={idea.id} className="card p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">{idea.titulo}</p>
                          <Badge tone={prioridadTone[idea.prioridad]}>{idea.prioridad}</Badge>
                        </div>
                        {idea.descripcion && <p className="mt-1 line-clamp-2 text-xs text-ink-faint">{idea.descripcion}</p>}
                        {idea.bom && idea.bom.length > 0 && (() => {
                          const { costo, margenPct } = margenProducto(db.materials, idea.bom ?? [], idea.precioEstimado ?? 0)
                          return (
                            <div className="mt-2 flex items-center justify-between rounded-md bg-surface-muted px-2 py-1 text-[11px]">
                              <span className="text-ink-faint">Costo {clp(costo)}</span>
                              {(idea.precioEstimado ?? 0) > 0 && (
                                <span className={`font-semibold ${margenPct < 0 ? 'text-accent' : 'text-ink'}`}>
                                  Margen {num(margenPct * 100)}%
                                </span>
                              )}
                            </div>
                          )
                        })()}
                        {idea.productoCreado && (
                          <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-secondary">
                            <CheckCircle2 size={12} /> En inventario
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-1 border-t border-surface-border pt-2">
                          <button
                            className="btn-ghost !p-1 disabled:opacity-30"
                            disabled={idx === 0}
                            title="Etapa anterior"
                            onClick={() => moverIdea(idea.id, IDEA_STAGES[idx - 1].id)}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            className="btn-ghost !p-1 disabled:opacity-30"
                            disabled={idx === IDEA_STAGES.length - 1}
                            title="Avanzar etapa"
                            onClick={() => moverIdea(idea.id, IDEA_STAGES[idx + 1].id)}
                          >
                            <ChevronRight size={16} />
                          </button>
                          <button className="btn-ghost ml-auto !p-1" title="Editar" onClick={() => setEditing(idea)}>
                            <Pencil size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(creating || editing) && (
        <IdeaForm idea={editing} onClose={() => { setCreating(false); setEditing(null) }} />
      )}
    </div>
  )
}

function IdeaForm({ idea, onClose }: { idea: ProjectIdea | null; onClose: () => void }) {
  const materials = useDb((d) => d.materials)
  const [f, setF] = useState(() => ({
    titulo: idea?.titulo ?? '',
    descripcion: idea?.descripcion ?? '',
    stage: (idea?.stage ?? 'idea') as IdeaStage,
    prioridad: (idea?.prioridad ?? 'media') as Prioridad,
    notas: idea?.notas ?? '',
    bom: (idea?.bom ?? []) as BomItem[],
    precioEstimado: idea?.precioEstimado ?? 0,
  }))
  const [margenObjetivo, setMargenObjetivo] = useState(60)
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }))

  // Costo y margen estimados en vivo (mismo marco que la ficha de producto).
  const costo = costoProducto(materials, f.bom)
  const { margenMonto, margenPct } = margenProducto(materials, f.bom, f.precioEstimado)
  const sugerido = precioSugerido(costo, margenObjetivo)

  const guardar = () => {
    const campos = {
      titulo: f.titulo,
      descripcion: f.descripcion,
      prioridad: f.prioridad,
      notas: f.notas,
      bom: f.bom,
      precioEstimado: f.precioEstimado,
    }
    if (idea) {
      // Actualiza primero (para que la conversion a producto use la receta fresca),
      // luego mueve de etapa si cambio.
      updateIdea(idea.id, campos)
      if (f.stage !== idea.stage) moverIdea(idea.id, f.stage)
    } else {
      addIdea({ ...campos, stage: f.stage })
    }
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={idea ? 'Editar idea' : 'Nueva idea'} wide>
      <div className="space-y-4">
        <Field label="Titulo">
          <input className="input" value={f.titulo} onChange={(e) => set('titulo', e.target.value)} />
        </Field>
        <Field label="Descripcion">
          <textarea className="input" rows={2} value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Etapa">
            <select className="input" value={f.stage} onChange={(e) => set('stage', e.target.value)}>
              {IDEA_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Prioridad">
            <select className="input" value={f.prioridad} onChange={(e) => set('prioridad', e.target.value)}>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </Field>
          <Field label="Precio estimado (CLP)">
            <input type="number" className="input" value={f.precioEstimado} onChange={(e) => set('precioEstimado', Number(e.target.value))} />
          </Field>
        </div>

        {/* Receta de insumos necesarios (para estimar costo) */}
        <div>
          <p className="label">Insumos necesarios (receta)</p>
          <BomEditor materials={materials} bom={f.bom} onChange={(bom) => set('bom', bom)} />
        </div>

        {idea?.productoCreado && (
          <p className="rounded-lg bg-surface-muted px-3 py-2 text-xs text-ink-soft">
            Esta idea ya esta en Inventario. Editar aqui su receta o precio NO modifica el producto ya creado.
          </p>
        )}

        {/* Costo, margen y precio sugerido */}
        <div className="rounded-lg bg-surface-muted p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Costo insumos</p>
              <p className="text-lg font-extrabold text-ink">{clp(costo)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Margen</p>
              <p className={`text-lg font-extrabold ${margenMonto < 0 ? 'text-accent' : 'text-ink'}`}>{clp(margenMonto)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Margen %</p>
              <p className={`text-lg font-extrabold ${margenPct < 0 ? 'text-accent' : 'text-ink'}`}>
                {f.precioEstimado > 0 ? `${num(margenPct * 100)}%` : '-'}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-surface-border pt-3">
            <span className="text-sm text-ink-soft">Precio para margen</span>
            <input
              type="number"
              className="input w-20"
              value={margenObjetivo}
              onChange={(e) => setMargenObjetivo(Number(e.target.value))}
            />
            <span className="text-sm text-ink-soft">% =</span>
            <b className="text-ink">{clp(sugerido)}</b>
            <button type="button" className="btn-outline !py-1.5 text-xs" disabled={sugerido <= 0} onClick={() => set('precioEstimado', sugerido)}>
              Aplicar como precio
            </button>
          </div>
        </div>

        <Field label="Notas">
          <textarea className="input" rows={2} value={f.notas} onChange={(e) => set('notas', e.target.value)} />
        </Field>
        {f.stage === 'listo' && !idea?.productoCreado && (
          <p className="rounded-lg bg-secondary-50 px-3 py-2 text-xs text-ink">
            Al guardar en etapa "Listo" se creara un producto en Inventario con esta receta y precio.
          </p>
        )}
      </div>
      <div className="mt-6 flex items-center justify-between">
        {idea ? (
          <button className="btn-ghost text-accent" onClick={() => { if (confirm('Eliminar idea?')) { deleteIdea(idea.id); onClose() } }}>
            Eliminar
          </button>
        ) : <span />}
        <div className="flex gap-2">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={!f.titulo.trim()} onClick={guardar}>Guardar</button>
        </div>
      </div>
    </Modal>
  )
}
