import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, useLocation } from 'react-router-dom'
import App from './App'
import { AuthGate } from './features/auth/AuthGate'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PublicCatalog } from './features/catalog/PublicCatalog'
import './index.css'

// La ruta publica /c (catalogo compartido) se renderiza FUERA del login, para
// que cualquiera pueda verla desde el link. El resto de la app pasa por AuthGate.
function Root() {
  const { pathname } = useLocation()
  if (pathname === '/c') return <PublicCatalog />
  return (
    <AuthGate>
      <App />
    </AuthGate>
  )
}

// HashRouter para que el ruteo funcione tambien bajo file:// (Electron) y en
// el webview de Capacitor sin configuracion de servidor.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <Root />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
