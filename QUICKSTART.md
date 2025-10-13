# Quick Start Guide

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

This will install all required packages including:
- React & React DOM
- TypeScript
- Vite
- Tailwind CSS
- Radix UI components
- Zustand (state management)
- Axios (HTTP client)
- Lucide React (icons)

### 2. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Build for Production
```bash
npm run build
```

Built files will be in the `dist/` directory.

## First Steps in the App

### 1. Create a Project
1. Click **"New Project"** in the top bar
2. Click **"Select Folder"** to choose a folder from your computer
3. **Grant permission** when your browser asks (this is required)
4. Enter a project name (defaults to the folder name)
5. Click **"Create Project"**

**Important**: 
- Use Chrome, Edge, or Opera browser (File System Access API required)
- The folder you select will contain all your project files
- All file operations will work with real files on your disk

### 2. Create Files and Folders
1. In the file explorer sidebar, click the **folder icon** to create a folder (creates real folder on disk)
2. Click the **file icon** to create a file (creates real file on disk)
3. Right-click any item to rename or delete it (modifies actual files)
4. Click on a file to open it in the editor (reads from disk)

**Note**: All operations immediately affect your local file system!

### 3. Use the Chat Interface
1. Make sure you're on the **Chat** tab
2. Click **"New Chat"** if no chat exists
3. Type a message and press Enter
4. View the simulated AI response

### 4. Edit Files
1. Click on any file in the explorer (loads content from disk)
2. Switch to the **Editor** tab
3. Edit the content in the textarea
4. Click **"Save"** when done (writes to disk immediately)

**Tip**: The save button is only enabled when you have unsaved changes

### 5. Configure AI Agents
1. Click **"Show Agents"** in the top right
2. Select a tab (Orchestrator, Agent 1, Agent 2, or Agent 3)
3. Choose an AI provider (e.g., OpenAI, Anthropic, Ollama)
4. Enter your API key (if required)
5. Wait for models to load
6. Select a model from the dropdown
7. Configure the system prompt
8. Click **"Save Configuration"**

## AI Provider Setup

### OpenAI
1. Get API key from https://platform.openai.com/api-keys
2. Select "OpenAI" as provider
3. Enter your API key
4. Models will load automatically (GPT-4, GPT-3.5, etc.)

### Anthropic (Claude)
1. Get API key from https://console.anthropic.com/
2. Select "Anthropic" as provider
3. Enter your API key
4. Available models: Claude 3 Opus, Sonnet, Haiku

### Ollama (Local)
1. Install Ollama from https://ollama.ai
2. Run `ollama serve` to start the server
3. Pull models: `ollama pull llama2`
4. Select "Ollama" as provider
5. No API key needed - models load from localhost:11434

### OpenRouter
1. Get API key from https://openrouter.ai/keys
2. Select "OpenRouter" as provider
3. Enter your API key
4. Access to 100+ models from various providers

## Keyboard Shortcuts

- **Enter** - Send chat message
- **Escape** - Cancel file rename
- **Enter** (while renaming) - Confirm rename

## Tips & Tricks

### File Management
- **Nested folders**: Create a folder, then right-click it to add files/folders inside
- **Quick rename**: Right-click any file/folder and select "Rename"
- **Bulk organization**: Create folder structure first, then add files

### Chat Sessions
- **Multiple chats**: Create different chats for different topics
- **Chat history**: Toggle the sidebar to see all your chat sessions
- **Delete chats**: Right-click a chat session to delete it

### Agent Configuration
- **Orchestrator**: Main agent for user interaction
- **Sub-agents**: Configure for specialized tasks (research, analysis, writing)
- **System prompts**: Define agent behavior and capabilities
- **Model selection**: Choose based on task complexity and speed needs

### Project Organization
- **One project per domain**: Create separate projects for different areas
- **Folder structure**: Organize files logically (e.g., /research, /notes, /drafts)
- **File naming**: Use descriptive names for easy identification

## Common Issues

### Browser not supported?
- **Problem**: Message says "Browser Not Supported"
- **Solution**: Use Chrome, Edge, or Opera (Chromium-based browsers)
- **Why**: File System Access API is only available in these browsers

### Permission denied?
- **Problem**: Can't access folder or files
- **Solution**: Re-select the folder to grant permissions again
- **Why**: Browser permissions may have been revoked

### Files not showing?
- **Problem**: Folder is empty or files don't appear
- **Solution**: Make sure you selected the correct folder
- **Check**: Verify files exist in the folder using your file manager

### Can't save file?
- **Problem**: Save button doesn't work
- **Solution**: Check browser console for errors
- **Verify**: Ensure you have write permissions for the folder

### Models not loading?
- **Check API key**: Ensure it's entered correctly
- **Check network**: Verify internet connection
- **Try retry**: Click "Retry Loading Models" button
- **Check provider status**: Some providers may have API issues

### Ollama not working?
- **Start server**: Run `ollama serve` in terminal
- **Check port**: Ensure Ollama is running on localhost:11434
- **Pull models**: Run `ollama pull <model-name>` first

### File not saving?
- **Check selection**: Ensure file is selected in explorer
- **Check changes**: Save button only enables when content changes
- **Refresh**: Try selecting another file and back

## Development

### Project Structure
```
src/
├── components/     # React components
├── services/       # API integrations
├── store/          # State management
└── lib/            # Utilities
```

### Adding a New AI Provider
Edit `src/services/ai-providers.ts`:

```typescript
const myProvider: AIProvider = {
  id: 'my-provider',
  name: 'My Provider',
  requiresApiKey: true,
  getModels: async (apiKey) => {
    // Fetch models from API
    return [
      { id: 'model-1', name: 'Model 1', description: 'Description' }
    ]
  }
}

// Add to exports
export const AI_PROVIDERS = {
  // ... existing providers
  'my-provider': myProvider,
}
```

### Customizing Theme
Edit `src/index.css` to change colors:

```css
:root {
  --primary: 221.2 83.2% 53.3%;  /* Blue */
  --secondary: 210 40% 96.1%;     /* Light gray */
  /* ... more variables */
}
```

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review IMPLEMENTATION_SUMMARY.md for technical details
3. Check the code comments for inline documentation

## Next Steps

1. **Explore the UI**: Try all features to understand capabilities
2. **Configure agents**: Set up your preferred AI providers
3. **Create content**: Start building your project structure
4. **Customize**: Adjust theme and settings to your preference
5. **Integrate**: Connect to backend APIs for production use

Happy project managing! 🚀
