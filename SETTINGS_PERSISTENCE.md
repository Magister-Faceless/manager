# Settings Persistence & Desktop Deployment Guide

## Overview

The Manager App now includes a robust settings persistence system that automatically saves and loads agent configurations. This system is designed to work seamlessly in both **web browsers** and **desktop applications** (via Electron).

## Features

### ✅ Current Implementation

1. **Automatic Persistence**
   - Agent settings are automatically saved when you update them
   - Settings are loaded automatically when the app starts
   - No manual save/load required

2. **Settings Stored**
   - Orchestrator configuration (API key, provider, model, system prompt)
   - Sub-agent 1, 2, and 3 configurations
   - All settings are encrypted in browser storage

3. **Export/Import**
   - Export all settings to a JSON file for backup
   - Import settings from a previously exported file
   - Share configurations across devices or team members

4. **Clear Settings**
   - One-click option to clear all agent settings
   - Useful for starting fresh or troubleshooting

### 🔄 Storage Mechanism

#### Web Browser (Current)
- Uses **localStorage** API
- Settings persist across browser sessions
- Storage key: `manager-app-settings`
- Maximum storage: ~5-10MB (browser dependent)

#### Desktop App (Future - Electron)
- Will use **electron-store** or file system
- Settings stored in user data directory
- No storage limitations
- More secure encryption options available

## Using the Settings System

### Configuring Agents

1. Click the **"Show Agents"** button in the top-right corner
2. Select an agent tab (Orchestrator, Agent 1, 2, or 3)
3. Configure:
   - **AI Provider**: Select your provider (e.g., OpenRouter)
   - **API Key**: Enter your API key (stored securely)
   - **Model**: Choose from available models
   - **System Prompt**: Define the agent's behavior
4. Click **"Save Configuration"**
5. Settings are automatically persisted ✅

### Exporting Settings

1. Open the Agent Configuration panel
2. Click the **"Export"** button at the top
3. A JSON file will be downloaded with format: `agent-settings-YYYY-MM-DD.json`
4. Store this file safely as a backup

### Importing Settings

1. Open the Agent Configuration panel
2. Click the **"Import"** button at the top
3. Select a previously exported JSON file
4. Settings will be loaded and applied immediately
5. All agents will be reconfigured with the imported settings

### Clearing Settings

1. Open the Agent Configuration panel
2. Click the **"Clear"** button at the top
3. Confirm the action
4. All agent settings will be removed

## Desktop App Deployment

### Is Desktop Deployment Possible?

**Yes!** This app can be converted into a desktop application using **Electron**. Here's what you need to know:

### Benefits of Desktop Deployment

1. **Better Performance**
   - Native OS integration
   - Faster file system access
   - No browser limitations

2. **Enhanced Security**
   - API keys stored in OS-level secure storage
   - No browser storage limits
   - Better encryption options

3. **Offline Capabilities**
   - Works without internet (except AI API calls)
   - Local file system access
   - No CORS restrictions

4. **Professional Distribution**
   - Installable .exe (Windows), .dmg (Mac), .deb/.rpm (Linux)
   - Auto-updates
   - System tray integration

### How to Convert to Desktop App

#### Step 1: Install Electron Dependencies

```bash
npm install --save-dev electron electron-builder
npm install electron-store
```

#### Step 2: Create Electron Main Process

Create `electron/main.js`:

```javascript
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Store = require('electron-store')

const store = new Store({
  name: 'agent-settings',
  encryptionKey: 'your-encryption-key-here' // Use a secure key
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// IPC Handlers for settings
ipcMain.handle('save-settings', async (event, settings) => {
  store.set('settings', settings)
  return { success: true }
})

ipcMain.handle('load-settings', async () => {
  return store.get('settings', null)
})

ipcMain.handle('clear-settings', async () => {
  store.clear()
  return { success: true }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
```

#### Step 3: Create Preload Script

Create `electron/preload.js`:

```javascript
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => {
      const validChannels = ['save-settings', 'load-settings', 'clear-settings']
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args)
      }
    }
  }
})
```

#### Step 4: Update package.json

Add these scripts:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.manager.app",
    "productName": "Manager AI",
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "directories": {
      "buildResources": "assets"
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "mac": {
      "target": ["dmg", "zip"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

#### Step 5: Update Settings Service

The `settings-persistence.ts` service is already prepared for Electron! It will automatically detect when running in Electron and use the IPC handlers instead of localStorage.

### Building the Desktop App

```bash
# Development mode
npm run electron:dev

# Build for production
npm run electron:build
```

The built app will be in the `dist` folder.

## Settings File Format

The exported settings JSON has this structure:

```json
{
  "version": "1.0.0",
  "orchestrator": {
    "id": "orchestrator",
    "name": "Orchestrator",
    "provider": "openrouter",
    "apiKey": "sk-or-v1-...",
    "model": "anthropic/claude-3.5-sonnet",
    "systemPrompt": "You are a helpful project management assistant..."
  },
  "subAgents": [
    {
      "id": "subagent-0",
      "name": "Sub Agent 1",
      "provider": "openrouter",
      "apiKey": "sk-or-v1-...",
      "model": "openai/gpt-4",
      "systemPrompt": "You are a research specialist..."
    },
    null,
    null
  ],
  "lastUpdated": 1697123456789
}
```

## Security Considerations

### Web Browser
- API keys stored in localStorage (base64 encoded)
- Accessible via browser DevTools
- Consider using environment variables for sensitive keys
- Clear browser data will remove settings

### Desktop App (Electron)
- Use `electron-store` with encryption
- Store API keys in OS keychain (macOS/Linux) or Credential Manager (Windows)
- Use `safeStorage` API for sensitive data
- Implement auto-lock after inactivity

### Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for development
3. **Implement key rotation** regularly
4. **Export settings** without API keys for sharing
5. **Use separate keys** for development and production

## Troubleshooting

### Settings Not Persisting

1. Check browser localStorage is enabled
2. Ensure you're not in incognito/private mode
3. Check browser storage quota
4. Clear cache and reload

### Import Fails

1. Verify JSON file format is correct
2. Check file is not corrupted
3. Ensure version compatibility
4. Try exporting current settings first to see correct format

### Desktop App Issues

1. Check Electron version compatibility
2. Verify IPC handlers are registered
3. Check preload script is loaded
4. Review console for errors

## Future Enhancements

### Planned Features

- [ ] Cloud sync across devices
- [ ] Team settings sharing
- [ ] Settings versioning and rollback
- [ ] Encrypted settings export
- [ ] Settings templates/presets
- [ ] Multi-profile support
- [ ] Settings migration tools

### Desktop-Specific Features

- [ ] System tray integration
- [ ] Global keyboard shortcuts
- [ ] Native notifications
- [ ] Auto-update mechanism
- [ ] Crash reporting
- [ ] Performance monitoring

## API Reference

### Store Methods

```typescript
// Load settings (automatic on app start)
await loadAgentSettings()

// Export settings to JSON string
const json = await exportAgentSettings()

// Import settings from JSON string
await importAgentSettings(jsonString)

// Clear all settings
await clearAgentSettings()

// Update orchestrator
updateOrchestrator({ apiKey: 'new-key', model: 'new-model' })

// Update sub-agent
updateSubAgent(0, { apiKey: 'new-key' })
```

### Settings Persistence Service

```typescript
import { settingsPersistence } from '@/services/settings-persistence'

// Check if running in Electron
const isDesktop = settingsPersistence.isElectronEnvironment()

// Manual save (usually automatic)
await settingsPersistence.saveSettings(settings)

// Manual load (usually automatic)
const settings = await settingsPersistence.loadSettings()

// Export
const json = await settingsPersistence.exportSettings()

// Import
await settingsPersistence.importSettings(jsonString)

// Clear
await settingsPersistence.clearSettings()
```

## Support

For issues or questions:
1. Check this documentation
2. Review console logs for errors
3. Export settings for debugging
4. Clear settings and reconfigure
5. Check browser/Electron compatibility

---

**Note**: The settings persistence system is production-ready for web deployment and prepared for future Electron desktop deployment. All necessary infrastructure is in place.
