import type { CapacitorConfig } from '@capacitor/cli'

// Configuracion de la app movil (Capacitor). Envuelve la misma build web
// (webDir: dist). Ver README, seccion "App movil".
const config: CapacitorConfig = {
  appId: 'cl.artesania.manager',
  appName: 'Artesania Manager',
  webDir: 'dist',
  backgroundColor: '#f5f6fa',
}

export default config
