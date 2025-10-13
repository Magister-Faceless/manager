import { create } from 'zustand'

// Types
export interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  parentId: string | null
  path: string
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle
  content?: string
  children?: string[]
  createdAt: number
  updatedAt: number
}

export interface Project {
  id: string
  name: string
  path: string
  directoryHandle?: FileSystemDirectoryHandle
  createdAt: number
  updatedAt: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatSession {
  id: string
  name: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface AgentConfig {
  id: string
  name: string
  provider: string
  apiKey: string
  model: string
  systemPrompt: string
}

interface AppState {
  // Projects
  projects: Project[]
  currentProject: Project | null
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  selectProject: (projectId: string) => void
  deleteProject: (projectId: string) => void
  loadProjectFiles: () => Promise<void>

  // Files
  files: Record<string, FileItem>
  currentFile: FileItem | null
  addFile: (file: Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateFile: (fileId: string, updates: Partial<FileItem>) => Promise<void>
  deleteFile: (fileId: string) => Promise<void>
  renameFile: (fileId: string, newName: string) => Promise<void>
  moveFile: (fileId: string, newParentId: string) => Promise<void>
  selectFile: (fileId: string) => Promise<void>
  refreshFiles: () => Promise<void>

  // Chat
  chatSessions: ChatSession[]
  currentSession: ChatSession | null
  createChatSession: () => void
  selectChatSession: (sessionId: string) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  deleteChatSession: (sessionId: string) => void

  // Agents
  orchestrator: AgentConfig | null
  subAgents: [AgentConfig | null, AgentConfig | null, AgentConfig | null]
  updateOrchestrator: (config: Partial<AgentConfig>) => void
  updateSubAgent: (index: 0 | 1 | 2, config: Partial<AgentConfig>) => void

  // UI State
  showAgentPanel: boolean
  toggleAgentPanel: () => void
}

export const useStore = create<AppState>((set, get) => ({
  // Projects
  projects: [],
  currentProject: null,
  addProject: (project) => {
    const newProject: Project = {
      ...project,
      id: `project-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    set((state) => ({
      projects: [...state.projects, newProject],
      currentProject: newProject,
    }))
  },
  selectProject: (projectId) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (project) {
      set({ currentProject: project })
    }
  },
  deleteProject: (projectId) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      currentProject:
        state.currentProject?.id === projectId ? null : state.currentProject,
    }))
  },

  // Files
  files: {},
  currentFile: null,
  addFile: (file) => {
    const newFile: FileItem = {
      ...file,
      id: `file-${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      children: file.type === 'folder' ? [] : undefined,
    }
    
    set((state) => {
      const newFiles = { ...state.files, [newFile.id]: newFile }
      
      // Update parent's children array if there's a parent
      if (newFile.parentId && state.files[newFile.parentId]) {
        const parent = state.files[newFile.parentId]
        if (parent.children) {
          newFiles[newFile.parentId] = {
            ...parent,
            children: [...parent.children, newFile.id],
          }
        }
      }
      
      return { files: newFiles }
    })
  },
  updateFile: (fileId, updates) => {
    set((state) => {
      const file = state.files[fileId]
      if (!file) return state
      
      return {
        files: {
          ...state.files,
          [fileId]: {
            ...file,
            ...updates,
            updatedAt: Date.now(),
          },
        },
        currentFile:
          state.currentFile?.id === fileId
            ? { ...file, ...updates, updatedAt: Date.now() }
            : state.currentFile,
      }
    })
  },
  deleteFile: (fileId) => {
    set((state) => {
      const file = state.files[fileId]
      if (!file) return state
      
      const newFiles = { ...state.files }
      
      // Remove from parent's children
      if (file.parentId && newFiles[file.parentId]) {
        const parent = newFiles[file.parentId]
        if (parent.children) {
          newFiles[file.parentId] = {
            ...parent,
            children: parent.children.filter((id) => id !== fileId),
          }
        }
      }
      
      // Delete the file
      delete newFiles[fileId]
      
      // If it's a folder, delete all children recursively
      if (file.type === 'folder' && file.children) {
        const deleteRecursive = (id: string) => {
          const item = newFiles[id]
          if (item?.type === 'folder' && item.children) {
            item.children.forEach(deleteRecursive)
          }
          delete newFiles[id]
        }
        file.children.forEach(deleteRecursive)
      }
      
      return {
        files: newFiles,
        currentFile: state.currentFile?.id === fileId ? null : state.currentFile,
      }
    })
  },
  selectFile: (fileId) => {
    const file = get().files[fileId]
    if (file && file.type === 'file') {
      set({ currentFile: file })
    }
  },

  // Chat
  chatSessions: [],
  currentSession: null,
  createChatSession: () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      name: `Chat ${get().chatSessions.length + 1}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    set((state) => ({
      chatSessions: [...state.chatSessions, newSession],
      currentSession: newSession,
    }))
  },
  selectChatSession: (sessionId) => {
    const session = get().chatSessions.find((s) => s.id === sessionId)
    if (session) {
      set({ currentSession: session })
    }
  },
  addMessage: (message) => {
    const currentSession = get().currentSession
    if (!currentSession) {
      // Create a new session if none exists
      get().createChatSession()
    }
    
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }
    
    set((state) => {
      const session = state.currentSession
      if (!session) return state
      
      const updatedSession = {
        ...session,
        messages: [...session.messages, newMessage],
        updatedAt: Date.now(),
      }
      
      return {
        chatSessions: state.chatSessions.map((s) =>
          s.id === session.id ? updatedSession : s
        ),
        currentSession: updatedSession,
      }
    })
  },
  deleteChatSession: (sessionId) => {
    set((state) => ({
      chatSessions: state.chatSessions.filter((s) => s.id !== sessionId),
      currentSession:
        state.currentSession?.id === sessionId ? null : state.currentSession,
    }))
  },

  // Agents
  orchestrator: null,
  subAgents: [null, null, null],
  updateOrchestrator: (config) => {
    set((state) => ({
      orchestrator: state.orchestrator
        ? { ...state.orchestrator, ...config }
        : {
            id: 'orchestrator',
            name: 'Orchestrator',
            provider: '',
            apiKey: '',
            model: '',
            systemPrompt: '',
            ...config,
          },
    }))
  },
  updateSubAgent: (index, config) => {
    set((state) => {
      const newSubAgents = [...state.subAgents] as [
        AgentConfig | null,
        AgentConfig | null,
        AgentConfig | null
      ]
      newSubAgents[index] = state.subAgents[index]
        ? { ...state.subAgents[index]!, ...config }
        : {
            id: `subagent-${index}`,
            name: `Sub Agent ${index + 1}`,
            provider: '',
            apiKey: '',
            model: '',
            systemPrompt: '',
            ...config,
          }
      return { subAgents: newSubAgents }
    })
  },

  // UI State
  showAgentPanel: false,
  toggleAgentPanel: () => set((state) => ({ showAgentPanel: !state.showAgentPanel })),
}))
