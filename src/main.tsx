import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AuthGate } from './features/auth/AuthGate'
import './index.css'

// HashRouter para que el ruteo funcione tambien bajo file:// (Electron) y en
// el webview de Capacitor sin configuracion de servidor.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthGate>
        <App />
      </AuthGate>
    </HashRouter>
  </React.StrictMode>,
)
