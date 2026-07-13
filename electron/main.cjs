// Envoltorio de escritorio (Electron). Carga el dev server en desarrollo y la
// build estatica (dist/) en produccion. Requiere instalar las herramientas de
// empaquetado (ver README, seccion "App de escritorio").
const { app, BrowserWindow } = require('electron')
const path = require('node:path')

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#f5f6fa',
    title: 'Artesania Manager',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
