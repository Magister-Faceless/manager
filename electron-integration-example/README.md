# Electron Integration Example

This directory contains example files for converting the Manager App into a desktop application using Electron.

## Files Included

- **`main.js`** - Electron main process (backend)
- **`preload.js`** - Secure bridge between main and renderer processes
- **`package.json.example`** - Updated package.json with Electron scripts and build config

## Quick Setup

### 1. Install Dependencies

```bash
npm install --save-dev electron electron-builder concurrently wait-on cross-env
npm install electron-store
```

### 2. Copy Files

```bash
# Create electron directory
mkdir electron

# Copy the example files
cp electron-integration-example/main.js electron/
cp electron-integration-example/preload.js electron/

# Merge package.json changes
# (Manually copy the scripts and build sections from package.json.example)
```

### 3. Update package.json

Add these sections to your `package.json`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && cross-env NODE_ENV=development electron .\"",
    "electron:build": "npm run build && electron-builder"
  }
}
```

Copy the entire `build` section from `package.json.example`.

### 4. Run Desktop App

```bash
# Development mode (with hot reload)
npm run electron:dev

# Build for production
npm run electron:build
```

## How It Works

### Architecture

```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│  (Node.js, full system access)          │
│                                          │
│  - Creates browser window                │
│  - Handles IPC requests                  │
│  - Manages settings storage              │
│  - OS integration                        │
└──────────────┬──────────────────────────┘
               │
               │ IPC Communication
               │ (secure, whitelisted)
               │
┌──────────────▼──────────────────────────┐
│         Preload Script                   │
│  (Privileged context)                    │
│                                          │
│  - Exposes safe APIs                     │
│  - Validates IPC channels                │
│  - Security bridge                       │
└──────────────┬──────────────────────────┘
               │
               │ contextBridge
               │
┌──────────────▼──────────────────────────┐
│      Renderer Process (React App)       │
│  (Sandboxed, limited access)             │
│                                          │
│  - Your React components                 │
│  - Uses window.electron APIs             │
│  - Auto-detects Electron environment     │
└──────────────────────────────────────────┘
```

### Settings Flow

1. **User updates agent settings** in React UI
2. **Store calls** `settingsPersistence.saveSettings()`
3. **Service detects** Electron environment
4. **IPC call** to `window.electron.ipcRenderer.invoke('save-settings', settings)`
5. **Main process** receives request via IPC handler
6. **electron-store** saves to encrypted file in user data directory
7. **Success response** sent back to renderer

### Storage Location

Settings are stored in OS-specific user data directories:

- **Windows**: `%APPDATA%\Manager AI\agent-settings.json`
- **macOS**: `~/Library/Application Support/Manager AI/agent-settings.json`
- **Linux**: `~/.config/Manager AI/agent-settings.json`

## Security Features

### 1. Context Isolation
- Renderer process is sandboxed
- No direct access to Node.js APIs
- Only whitelisted APIs exposed

### 2. IPC Channel Whitelist
- Only specific channels allowed
- Prevents arbitrary code execution
- Validated in preload script

### 3. Encrypted Storage
- Settings encrypted with electron-store
- API keys protected at OS level
- Secure key derivation

### 4. Content Security
- Prevents navigation to external URLs
- Blocks opening new windows
- Validates all IPC messages

## Customization

### Change App Icon

1. Create icons in `assets/` directory:
   - `icon.ico` (Windows, 256x256)
   - `icon.icns` (macOS, multiple sizes)
   - `icon.png` (Linux, 512x512)

2. Use a tool like [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder):

```bash
npm install -g electron-icon-builder
electron-icon-builder --input=./icon.png --output=./assets
```

### Change App Name

Update in `package.json`:

```json
{
  "name": "your-app-name",
  "build": {
    "appId": "com.yourcompany.yourapp",
    "productName": "Your App Name"
  }
}
```

### Add Auto-Updates

1. Set up GitHub releases or update server
2. Add to `main.js`:

```javascript
const { autoUpdater } = require('electron-updater')

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify()
})
```

3. Configure in `package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "yourusername",
      "repo": "yourrepo"
    }
  }
}
```

## Building for Distribution

### Windows

```bash
npm run electron:build:win
```

Output: `release/Manager AI-1.0.0-x64.exe`

### macOS

```bash
npm run electron:build:mac
```

Output: `release/Manager AI-1.0.0-arm64.dmg`

**Note**: macOS builds require code signing for distribution. Set up Apple Developer account and certificates.

### Linux

```bash
npm run electron:build:linux
```

Output: 
- `release/Manager AI-1.0.0-x64.AppImage`
- `release/Manager AI-1.0.0-x64.deb`
- `release/Manager AI-1.0.0-x64.rpm`

## Testing

### Development Testing

```bash
npm run electron:dev
```

- Opens app with DevTools
- Hot reload enabled
- Console logs visible

### Production Testing

```bash
npm run build
npm run electron:build
```

Install and test the built app before distribution.

## Troubleshooting

### App Won't Start

1. Check console for errors
2. Verify `main.js` and `preload.js` paths
3. Ensure all dependencies installed
4. Try deleting `node_modules` and reinstalling

### Settings Not Persisting

1. Check user data directory exists
2. Verify IPC handlers registered
3. Check preload script loaded
4. Review console for IPC errors

### Build Fails

1. Check `electron-builder` version compatibility
2. Verify icon files exist
3. Check build configuration in `package.json`
4. Try building for single platform first

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build)
- [electron-store](https://github.com/sindresorhus/electron-store)
- [Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)

## Next Steps

1. ✅ Copy files to your project
2. ✅ Install dependencies
3. ✅ Test in development mode
4. ✅ Customize app icon and name
5. ✅ Build for your platform
6. ✅ Test production build
7. ✅ Set up code signing (for distribution)
8. ✅ Configure auto-updates (optional)
9. ✅ Distribute to users

---

**The settings persistence service is already compatible!** No changes needed to your React code.
