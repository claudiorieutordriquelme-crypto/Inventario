import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Send, Trash2, Image as ImageIcon } from 'lucide-react'
import { useDb, setState, uid, nowIso } from '@/lib/store'
import type { CommunityPost } from '@/lib/types'
import { SectionTitle, Card, Field, EmptyState } from '@/components/ui'
import { SmartImage } from '@/components/SmartImage'
import { fecha } from '@/lib/format'

function addPost(contenido: string, imagenUrl: string, autor = 'Yo') {
  setState((db) => ({
    ...db,
    posts: [
      { id: uid('post'), autor, contenido, imagenUrl, likes: 0, liked: false, createdAt: nowIso() },
      ...db.posts,
    ],
  }))
}
// Toggle de "me gusta": suma o resta segun el estado actual.
function toggleLike(id: string) {
  setState((db) => ({
    ...db,
    posts: db.posts.map((p) =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
    ),
  }))
}
function deletePost(id: string) {
  setState((db) => ({ ...db, posts: db.posts.filter((p) => p.id !== id) }))
}

export function CommunityPage() {
  const posts = useDb((db) => db.posts)
  const [texto, setTexto] = useState('')
  const [imagen, setImagen] = useState('')

  const publicar = () => {
    if (!texto.trim()) return
    addPost(texto.trim(), imagen.trim())
    setTexto('')
    setImagen('')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SectionTitle title="Comunidad" sub="Comparte avances, patrones y novedades con tu comunidad" />

      <Card>
        <textarea
          className="input"
          rows={3}
          placeholder="Que quieres compartir hoy?"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <div className="mt-3">
          <Field label="Foto (opcional)">
            <div className="relative">
              <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                className="input pl-9"
                placeholder="Pega el link de una foto"
                value={imagen}
                onChange={(e) => setImagen(e.target.value)}
              />
            </div>
          </Field>
        </div>
        <div className="mt-3 flex justify-end">
          <button className="btn-primary" disabled={!texto.trim()} onClick={publicar}>
            <Send size={16} /> Publicar
          </button>
        </div>
      </Card>

      {posts.length === 0 ? (
        <EmptyState title="Sin publicaciones" hint="Se el primero en compartir algo." />
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function PostCard({ post }: { post: CommunityPost }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 font-bold text-primary">
            {post.autor.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-ink">{post.autor}</p>
            <p className="text-xs text-ink-faint">{fecha(post.createdAt)}</p>
          </div>
        </div>
        <button className="btn-ghost !p-1.5 text-ink-faint" onClick={() => { if (confirm('Eliminar publicacion?')) deletePost(post.id) }}>
          <Trash2 size={16} />
        </button>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-ink-soft">{post.contenido}</p>

      {post.imagenUrl && (
        <SmartImage
          src={post.imagenUrl}
          alt={`Publicacion de ${post.autor}`}
          className="mt-3 aspect-[4/3] rounded-xl border border-surface-border"
          imgClassName="h-full object-cover"
        />
      )}

      <div className="mt-3 border-t border-surface-border pt-3">
        <button
          className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
            post.liked ? 'text-accent' : 'text-ink-faint hover:text-accent'
          }`}
          onClick={() => toggleLike(post.id)}
        >
          <motion.span whileTap={{ scale: 1.35 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }}>
            <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} />
          </motion.span>
          {post.likes}
        </button>
      </div>
    </Card>
  )
}
