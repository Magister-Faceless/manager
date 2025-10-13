/**
 * Electron Preload Script
 * 
 * This script runs in a privileged context and creates a secure bridge
 * between the renderer process (your React app) and the main process.
 * 
 * It exposes only specific, safe APIs to the renderer process.
 */

const { contextBridge, ipcRenderer } = require('electron')

/**
 * Expose safe APIs to the renderer process
 * These will be available as window.electron in your React app
 */
contextBridge.exposeInMainWorld('electron', {
  /**
   * IPC Renderer - for communication with main process
   */
  ipcRenderer: {
    /**
     * Invoke a handler in the main process and wait for response
     * Only allows whitelisted channels for security
     */
    invoke: (channel, ...args) => {
      const validChannels = [
        'save-settings',
        'load-settings',
        'clear-settings',
        'get-app-version',
        'get-app-path'
      ]
      
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args)
      } else {
        console.error(`Invalid IPC channel: ${channel}`)
        throw new Error(`IPC channel "${channel}" is not allowed`)
      }
    },

    /**
     * Send a message to main process (one-way, no response)
     */
    send: (channel, ...args) => {
      const validChannels = [
        'settings-updated',
        'log-message'
      ]
      
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args)
      } else {
        console.error(`Invalid IPC channel: ${channel}`)
      }
    },

    /**
     * Listen for messages from main process
     */
    on: (channel, callback) => {
      const validChannels = [
        'menu-export-settings',
        'menu-import-settings',
        'settings-changed'
      ]
      
      if (validChannels.includes(channel)) {
        // Wrap callback to only pass event data, not the full event object
        const subscription = (event, ...args) => callback(...args)
        ipcRenderer.on(channel, subscription)
        
        // Return unsubscribe function
        return () => {
          ipcRenderer.removeListener(channel, subscription)
        }
      } else {
        console.error(`Invalid IPC channel: ${channel}`)
      }
    },

    /**
     * Listen for a message once
     */
    once: (channel, callback) => {
      const validChannels = [
        'menu-export-settings',
        'menu-import-settings',
        'settings-changed'
      ]
      
      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, (event, ...args) => callback(...args))
      } else {
        console.error(`Invalid IPC channel: ${channel}`)
      }
    }
  },

  /**
   * Platform information
   */
  platform: {
    isElectron: true,
    platform: process.platform,
    arch: process.arch,
    version: process.versions.electron
  },

  /**
   * App information
   */
  app: {
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    getPath: () => ipcRenderer.invoke('get-app-path')
  }
})

/**
 * Log that preload script has loaded
 */
console.log('Preload script loaded successfully')
console.log('Platform:', process.platform)
console.log('Electron version:', process.versions.electron)
console.log('Chrome version:', process.versions.chrome)
console.log('Node version:', process.versions.node)

/**
 * Expose a flag to detect Electron environment
 * This is used by settings-persistence.ts to determine storage method
 */
window.isElectron = true
