/**
 * Settings Persistence Service
 * 
 * Provides a unified interface for persisting application settings
 * that works in both web (localStorage) and desktop (Electron) environments.
 * 
 * For desktop deployment with Electron, this service can be extended to use
 * electron-store or the file system for more robust persistence.
 */

export interface AgentSettings {
  id: string
  name: string
  provider: string
  apiKey: string
  model: string
  systemPrompt: string
}

export interface AppSettings {
  version: string
  orchestrator: AgentSettings | null
  subAgents: [AgentSettings | null, AgentSettings | null, AgentSettings | null]
  lastUpdated: number
}

const SETTINGS_KEY = 'manager-app-settings'
const SETTINGS_VERSION = '1.0.0'

class SettingsPersistenceService {
  private isElectron: boolean

  constructor() {
    // Detect if running in Electron
    this.isElectron = this.detectElectron()
  }

  /**
   * Detect if the app is running in Electron
   */
  private detectElectron(): boolean {
    // Check for Electron-specific properties
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase()
      if (userAgent.indexOf(' electron/') > -1) {
        return true
      }
      // Check for electron in window object (if exposed via preload)
      if ((window as any).electron) {
        return true
      }
    }
    return false
  }

  /**
   * Save settings to storage
   */
  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.loadSettings()
      const updatedSettings: AppSettings = {
        ...currentSettings,
        ...settings,
        version: SETTINGS_VERSION,
        lastUpdated: Date.now(),
      }

      if (this.isElectron) {
        // For Electron: Use IPC to save to file system
        // This would require setting up IPC handlers in Electron main process
        await this.saveToElectron(updatedSettings)
      } else {
        // For web: Use localStorage
        this.saveToLocalStorage(updatedSettings)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      throw error
    }
  }

  /**
   * Load settings from storage
   */
  async loadSettings(): Promise<AppSettings> {
    try {
      let settings: AppSettings | null = null

      if (this.isElectron) {
        // For Electron: Use IPC to load from file system
        settings = await this.loadFromElectron()
      } else {
        // For web: Use localStorage
        settings = this.loadFromLocalStorage()
      }

      // Return default settings if none found
      if (!settings) {
        return this.getDefaultSettings()
      }

      // Migrate settings if version mismatch
      if (settings.version !== SETTINGS_VERSION) {
        settings = this.migrateSettings(settings)
      }

      return settings
    } catch (error) {
      console.error('Failed to load settings:', error)
      return this.getDefaultSettings()
    }
  }

  /**
   * Export settings as JSON string
   */
  async exportSettings(): Promise<string> {
    const settings = await this.loadSettings()
    return JSON.stringify(settings, null, 2)
  }

  /**
   * Import settings from JSON string
   */
  async importSettings(jsonString: string): Promise<void> {
    try {
      const settings = JSON.parse(jsonString) as AppSettings
      
      // Validate settings structure
      if (!this.validateSettings(settings)) {
        throw new Error('Invalid settings format')
      }

      await this.saveSettings(settings)
    } catch (error) {
      console.error('Failed to import settings:', error)
      throw error
    }
  }

  /**
   * Clear all settings
   */
  async clearSettings(): Promise<void> {
    if (this.isElectron) {
      await this.clearElectronSettings()
    } else {
      localStorage.removeItem(SETTINGS_KEY)
    }
  }

  /**
   * Save to localStorage (web)
   */
  private saveToLocalStorage(settings: AppSettings): void {
    try {
      const json = JSON.stringify(settings)
      localStorage.setItem(SETTINGS_KEY, json)
    } catch (error) {
      console.error('localStorage save error:', error)
      throw new Error('Failed to save settings to localStorage')
    }
  }

  /**
   * Load from localStorage (web)
   */
  private loadFromLocalStorage(): AppSettings | null {
    try {
      const json = localStorage.getItem(SETTINGS_KEY)
      if (!json) return null
      return JSON.parse(json) as AppSettings
    } catch (error) {
      console.error('localStorage load error:', error)
      return null
    }
  }

  /**
   * Save to Electron (desktop)
   * This is a placeholder for future Electron implementation
   */
  private async saveToElectron(settings: AppSettings): Promise<void> {
    // For Electron implementation:
    // await window.electron.ipcRenderer.invoke('save-settings', settings)
    
    // Fallback to localStorage for now
    this.saveToLocalStorage(settings)
  }

  /**
   * Load from Electron (desktop)
   * This is a placeholder for future Electron implementation
   */
  private async loadFromElectron(): Promise<AppSettings | null> {
    // For Electron implementation:
    // return await window.electron.ipcRenderer.invoke('load-settings')
    
    // Fallback to localStorage for now
    return this.loadFromLocalStorage()
  }

  /**
   * Clear Electron settings (desktop)
   */
  private async clearElectronSettings(): Promise<void> {
    // For Electron implementation:
    // await window.electron.ipcRenderer.invoke('clear-settings')
    
    // Fallback to localStorage for now
    localStorage.removeItem(SETTINGS_KEY)
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): AppSettings {
    return {
      version: SETTINGS_VERSION,
      orchestrator: null,
      subAgents: [null, null, null],
      lastUpdated: Date.now(),
    }
  }

  /**
   * Validate settings structure
   */
  private validateSettings(settings: any): settings is AppSettings {
    if (!settings || typeof settings !== 'object') return false
    if (!settings.version || typeof settings.version !== 'string') return false
    if (!Array.isArray(settings.subAgents) || settings.subAgents.length !== 3) return false
    return true
  }

  /**
   * Migrate settings from older versions
   */
  private migrateSettings(settings: AppSettings): AppSettings {
    // Add migration logic here when settings structure changes
    // For now, just update the version
    return {
      ...settings,
      version: SETTINGS_VERSION,
    }
  }

  /**
   * Check if running in Electron
   */
  isElectronEnvironment(): boolean {
    return this.isElectron
  }
}

export const settingsPersistence = new SettingsPersistenceService()
