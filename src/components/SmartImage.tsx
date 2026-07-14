import { useState } from 'react'

// Imagen con carga fluida: muestra un skeleton (pulse) mientras carga y luego
// hace fade-in con blur-up. Evita saltos de layout y da sensacion moderna.
export function SmartImage({
  src,
  alt,
  className = '',
  imgClassName = '',
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-surface-border/60" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full transition-[opacity,filter,transform] duration-500 ${
          loaded ? 'opacity-100 blur-0' : 'scale-105 opacity-0 blur-md'
        } ${imgClassName}`}
      />
    </div>
  )
}
