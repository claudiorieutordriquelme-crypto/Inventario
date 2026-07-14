import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// La caché de Vite se guarda FUERA de OneDrive para evitar bloqueos de archivos
// (EPERM) cuando la carpeta del proyecto está sincronizada. Esto estabiliza el
// dev server y la carga de módulos en el navegador.
const cacheDir = join(tmpdir(), 'artesania-vite-cache')

// base './' para que la misma build funcione en Electron (file://) y Capacitor (webview)
export default defineConfig({
  base: './',
  cacheDir,
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    watch: {
      // Ignora ruido de sincronización de OneDrive para no recargar en loop.
      ignored: ['**/.git/**', '**/node_modules/**'],
    },
  },
})
