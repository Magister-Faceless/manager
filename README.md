# Project Manager AI

A modern, AI-powered project management application built with React, TypeScript, and Tailwind CSS. This application provides an intelligent assistant for managing various types of projects including research, business, professional, and writing projects.

## Features

### 📁 Local File System Integration
- **Real File Operations**: Work with actual files on your computer
- **Folder Selection**: Choose a local folder for each project
- **Full CRUD**: Create, read, update, delete, rename, and move files
- **Scoped Access**: All operations limited to the selected project folder
- **Browser-based**: Uses File System Access API (Chrome, Edge, Opera)
- **Secure**: Requires explicit user permission for folder access

### 🤖 AI Agent Management
- **Orchestrator Agent**: Main AI agent that coordinates all interactions
- **3 Sub-Agents**: Configurable specialized agents for specific tasks
- **Multiple AI Providers**: Support for OpenAI, Anthropic, OpenRouter, XAI, DeepSeek, Qwen, Z.AI, and Ollama
- **Dynamic Model Selection**: Automatically fetches available models from each provider
- **Custom System Prompts**: Define specific behaviors and capabilities for each agent

### 📁 File & Folder Management
- **File Type Selection**: Choose from 20+ file types (.txt, .md, .py, .js, .ts, etc.)
- **Multi-Tab Editor**: Open multiple files simultaneously in separate tabs
- **Tab Management**: Switch, close, and manage tabs like VS Code
- **Unsaved Changes Tracking**: Visual indicators for modified files
- Create, rename, and delete files and folders
- Hierarchical folder structure with expand/collapse
- File explorer with context menus
- Real-time file content editing

### 💬 Chat Interface
- Multiple chat sessions with history
- Session management (create, switch, delete)
- Message timestamps
- Auto-scrolling to latest messages
- Simulated AI responses (ready for backend integration)

### 🎯 Project Management
- Create and manage multiple projects
- Project selection and switching
- Project-specific file organization
- Dedicated workspace per project

### 🎨 Modern UI/UX
- Clean, professional interface inspired by Cursor IDE, Windsurf IDE, and Claude
- Dark mode support with CSS variables
- Responsive layout with resizable panels
- Smooth animations and transitions
- Accessible components using Radix UI

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd manager
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
manager/
├── src/
│   ├── components/
│   │   ├── AgentManagement/    # AI agent configuration
│   │   ├── ChatInterface/      # Chat UI and message handling
│   │   ├── FileEditor/         # File content editor
│   │   ├── FileExplorer/       # File tree and management
│   │   └── ui/                 # Reusable UI components
│   ├── services/
│   │   └── ai-providers.ts     # AI provider integrations
│   ├── store/
│   │   └── index.ts            # Zustand state management
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   ├── App.tsx                 # Main application component
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Configuration

### AI Providers

The application supports the following AI providers:

1. **OpenAI** - GPT-4, GPT-3.5 Turbo
2. **Anthropic** - Claude 3 (Opus, Sonnet, Haiku)
3. **OpenRouter** - Access to multiple models
4. **XAI** - Grok models
5. **DeepSeek** - DeepSeek Chat and Coder
6. **Qwen** - Qwen Turbo, Plus, Max
7. **Z.AI** - Z.AI models
8. **Ollama** - Local models (requires Ollama running on localhost:11434)

### Setting Up Agents

1. Click the "Show Agents" button in the top right
2. Select a tab (Orchestrator, Agent 1, Agent 2, or Agent 3)
3. Choose an AI provider from the dropdown
4. Enter your API key (if required)
5. Select a model from the dynamically loaded list
6. Configure the system prompt
7. Click "Save Configuration"

## Usage

### Creating a Project

1. Click "New Project" in the top bar
2. Click "Select Folder" to choose a folder from your computer
3. Grant permission when prompted by your browser
4. Enter a project name (defaults to folder name)
5. Click "Create Project"

**Note**: The File System Access API is only supported in Chrome, Edge, and Opera browsers.

### Managing Files

All file operations work with real files on your computer:

- **Create File**: 
  1. Click the file icon in the file explorer header
  2. Enter filename and select file type (.txt, .md, .py, .js, etc.)
  3. File is created on disk and opened in a new tab
  
- **Create Folder**: Click the folder icon in the file explorer header - creates actual folder on disk

- **Open Files**: Click on any file to open it in a new tab (or switch to existing tab)

- **Edit Files**: 
  - Multiple files can be open simultaneously in separate tabs
  - Switch between tabs by clicking tab headers
  - Each tab shows unsaved changes with a dot (●) indicator
  - Save button is enabled only when changes exist
  
- **Close Tabs**: Click X on any tab to close it (warns if unsaved changes)

- **Rename**: Right-click on a file/folder and select "Rename" - renames on disk

- **Delete**: Right-click on a file/folder and select "Delete" - removes from disk

**Important**: All changes are immediately written to your local file system.

### Using Chat

1. Create a new chat session or select an existing one
2. Type your message in the input field
3. Press Enter or click the send button
4. View AI responses in the chat area

## Development

### Adding New AI Providers

Edit `src/services/ai-providers.ts` and add a new provider object:

```typescript
const newProvider: AIProvider = {
  id: 'provider-id',
  name: 'Provider Name',
  requiresApiKey: true,
  getModels: async (apiKey) => {
    // Fetch and return models
  },
}
```

### Customizing UI

The application uses Tailwind CSS with CSS variables for theming. Edit `src/index.css` to customize colors and styles.

## Future Enhancements

- [ ] Backend integration for AI responses
- [ ] File upload and download
- [ ] Real-time collaboration
- [ ] Advanced search and filtering
- [ ] Export chat history
- [ ] Project templates
- [ ] Plugin system
- [ ] Cloud synchronization

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
