import { useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, Pencil, CheckCircle2 } from 'lucide-react'
import { useDb } from '@/lib/store'
import type { ProjectIdea, IdeaStage, Prioridad } from '@/lib/types'
import { SectionTitle, Badge, Modal, Field, EmptyState } from '@/components/ui'
import { IDEA_STAGES, ideasPorStage, addIdea, updateIdea, deleteIdea, moverIdea } from '@/lib/planning'

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
  const [f, setF] = useState(
    idea ?? {
      titulo: '',
      descripcion: '',
      stage: 'idea' as IdeaStage,
      prioridad: 'media' as Prioridad,
      notas: '',
    },
  )
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }))

  const guardar = () => {
    if (idea) {
      if (f.stage !== idea.stage) moverIdea(idea.id, f.stage) // registra conversion a inventario
      updateIdea(idea.id, { titulo: f.titulo, descripcion: f.descripcion, prioridad: f.prioridad, notas: f.notas })
    } else {
      addIdea({ titulo: f.titulo, descripcion: f.descripcion, stage: f.stage, prioridad: f.prioridad, notas: f.notas })
    }
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={idea ? 'Editar idea' : 'Nueva idea'}>
      <div className="space-y-4">
        <Field label="Titulo">
          <input className="input" value={f.titulo} onChange={(e) => set('titulo', e.target.value)} />
        </Field>
        <Field label="Descripcion">
          <textarea className="input" rows={2} value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        <Field label="Notas">
          <textarea className="input" rows={2} value={f.notas} onChange={(e) => set('notas', e.target.value)} />
        </Field>
        {f.stage === 'listo' && !idea?.productoCreado && (
          <p className="rounded-lg bg-secondary-50 px-3 py-2 text-xs text-ink">
            Al guardar en etapa "Listo" se creara automaticamente un producto en Inventario.
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
