/**
 * Electron Main Process
 * 
 * This is the main entry point for the Electron desktop app.
 * It creates the browser window and handles IPC communication for settings.
 */

const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')
const Store = require('electron-store')

// Initialize secure storage
const store = new Store({
  name: 'agent-settings',
  // Use a secure encryption key - generate a unique one for production
  encryptionKey: process.env.SETTINGS_ENCRYPTION_KEY || 'change-this-in-production',
  defaults: {
    version: '1.0.0',
    orchestrator: null,
    subAgents: [null, null, null],
    lastUpdated: Date.now()
  }
})

let mainWindow = null

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: 'Manager AI',
    backgroundColor: '#1a1a1a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Security settings
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    // Window styling
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../assets/icon.png') // Add your app icon
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    // Development mode - load from Vite dev server
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // Production mode - load built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Create application menu
  createMenu()
}

/**
 * Create application menu
 */
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Settings',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-export-settings')
          }
        },
        {
          label: 'Import Settings',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('menu-import-settings')
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://github.com/yourusername/manager-app')
          }
        },
        {
          label: 'About',
          click: () => {
            // Show about dialog
            const { dialog } = require('electron')
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Manager AI',
              message: 'Manager AI',
              detail: 'Version 1.0.0\n\nAn AI-powered project management assistant.',
              buttons: ['OK']
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

/**
 * IPC Handler: Save settings
 */
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    // Validate settings before saving
    if (!settings || typeof settings !== 'object') {
      throw new Error('Invalid settings format')
    }

    // Add metadata
    const settingsToSave = {
      ...settings,
      version: '1.0.0',
      lastUpdated: Date.now()
    }

    // Save to encrypted store
    store.set('settings', settingsToSave)

    console.log('Settings saved successfully')
    return { success: true }
  } catch (error) {
    console.error('Failed to save settings:', error)
    return { success: false, error: error.message }
  }
})

/**
 * IPC Handler: Load settings
 */
ipcMain.handle('load-settings', async () => {
  try {
    const settings = store.get('settings')
    
    if (!settings) {
      // Return default settings
      return {
        version: '1.0.0',
        orchestrator: null,
        subAgents: [null, null, null],
        lastUpdated: Date.now()
      }
    }

    console.log('Settings loaded successfully')
    return settings
  } catch (error) {
    console.error('Failed to load settings:', error)
    // Return default settings on error
    return {
      version: '1.0.0',
      orchestrator: null,
      subAgents: [null, null, null],
      lastUpdated: Date.now()
    }
  }
})

/**
 * IPC Handler: Clear settings
 */
ipcMain.handle('clear-settings', async () => {
  try {
    store.clear()
    console.log('Settings cleared successfully')
    return { success: true }
  } catch (error) {
    console.error('Failed to clear settings:', error)
    return { success: false, error: error.message }
  }
})

/**
 * IPC Handler: Get app version
 */
ipcMain.handle('get-app-version', async () => {
  return app.getVersion()
})

/**
 * IPC Handler: Get app path
 */
ipcMain.handle('get-app-path', async () => {
  return {
    userData: app.getPath('userData'),
    appData: app.getPath('appData'),
    temp: app.getPath('temp')
  }
})

/**
 * App lifecycle events
 */

// App is ready
app.whenReady().then(() => {
  createWindow()

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// All windows closed
app.on('window-all-closed', () => {
  // macOS: Keep app running when windows are closed
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Before quit - cleanup
app.on('before-quit', () => {
  console.log('App is quitting...')
  // Perform any cleanup here
})

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason)
})

/**
 * Security: Prevent navigation to external URLs
 */
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    // Allow navigation to localhost in development
    if (process.env.NODE_ENV === 'development' && parsedUrl.host === 'localhost:5173') {
      return
    }
    
    // Prevent all other navigation
    event.preventDefault()
    console.warn('Navigation prevented to:', navigationUrl)
  })

  // Prevent opening new windows
  contents.setWindowOpenHandler(({ url }) => {
    console.warn('Window open prevented for:', url)
    return { action: 'deny' }
  })
})

console.log('Electron app initialized')
console.log('Environment:', process.env.NODE_ENV || 'production')
console.log('User data path:', app.getPath('userData'))
