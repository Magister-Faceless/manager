import { create } from 'zustand'
import { fileSystemService } from '@/services/file-system'
import { settingsPersistence } from '@/services/settings-persistence'
import { chatPersistence, ChatThread } from '@/services/chat-persistence'
import { contextManager } from '@/services/context-manager'
import { getDefaultTools } from '@/services/tools'

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

export type { ChatThread }

export interface AgentConfig {
  id: string
  name: string
  provider: string
  apiKey: string
  model: string
  systemPrompt: string
  description: string // Description for orchestrator to understand when to use this agent
  temperature?: number
  maxTokens?: number
  selectedTools: string[] // Array of tool IDs this agent can use
}

interface AppState {
  // Projects
  projects: Project[]
  currentProject: Project | null
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  selectProject: (projectId: string) => Promise<void>
  deleteProject: (projectId: string) => void
  loadProjectFiles: () => Promise<void>

  // Files
  files: Record<string, FileItem>
  currentFile: FileItem | null
  openTabs: string[] // Array of file IDs
  activeTabId: string | null
  addFile: (file: Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateFile: (fileId: string, updates: Partial<FileItem>) => Promise<void>
  deleteFile: (fileId: string) => Promise<void>
  renameFile: (fileId: string, newName: string) => Promise<void>
  moveFile: (fileId: string, newParentId: string) => Promise<void>
  selectFile: (fileId: string) => Promise<void>
  openFileInTab: (fileId: string) => Promise<void>
  closeTab: (fileId: string) => void
  setActiveTab: (fileId: string) => void
  refreshFiles: () => Promise<void>

  // Chat
  chatSessions: ChatSession[]
  currentSession: ChatSession | null
  createChatSession: (name?: string) => Promise<void>
  selectChatSession: (sessionId: string) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>
  deleteChatSession: (sessionId: string) => Promise<void>
  loadChatThreads: () => Promise<void>
  renameChatSession: (sessionId: string, newName: string) => Promise<void>

  // Agents
  orchestrator: AgentConfig | null
  subAgents: AgentConfig[] // Dynamic array of agents
  createSubAgent: (config: Omit<AgentConfig, 'id'>) => Promise<void>
  updateSubAgent: (id: string, config: Partial<AgentConfig>) => Promise<void>
  deleteSubAgent: (id: string) => Promise<void>
  updateOrchestrator: (config: Partial<AgentConfig>) => void
  loadAgentSettings: () => Promise<void>
  exportAgentSettings: () => Promise<string>
  importAgentSettings: (jsonString: string) => Promise<void>
  clearAgentSettings: () => Promise<void>

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
    
    // Load files and chat threads after setting project
    if (newProject.directoryHandle) {
      fileSystemService.setRootHandle(newProject.directoryHandle)
      chatPersistence.setRootHandle(newProject.directoryHandle)
      contextManager.setRootHandle(newProject.directoryHandle)
      
      // Initialize .agent/ folder
      contextManager.initializeAgentFolder().catch(error => {
        console.error('Failed to initialize agent folder:', error)
      })
      
      get().loadProjectFiles()
      get().loadChatThreads()
    }
  },
  
  selectProject: async (projectId) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (project) {
      set({ currentProject: project, files: {}, currentFile: null, chatSessions: [], currentSession: null })
      
      // Set the file system root and load files
      if (project.directoryHandle) {
        fileSystemService.setRootHandle(project.directoryHandle)
        chatPersistence.setRootHandle(project.directoryHandle)
        contextManager.setRootHandle(project.directoryHandle)
        
        // Initialize .agent/ folder
        await contextManager.initializeAgentFolder().catch(error => {
          console.error('Failed to initialize agent folder:', error)
        })
        
        await get().loadProjectFiles()
        await get().loadChatThreads()
      }
    }
  },
  
  deleteProject: (projectId) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      currentProject:
        state.currentProject?.id === projectId ? null : state.currentProject,
      files: state.currentProject?.id === projectId ? {} : state.files,
    }))
  },
  
  loadProjectFiles: async () => {
    const { currentProject } = get()
    if (!currentProject?.directoryHandle) return

    try {
      const items = await fileSystemService.readDirectory(
        currentProject.directoryHandle,
        ''
      )
      
      const files: Record<string, FileItem> = {}
      
      // Process items recursively
      const processItems = async (
        items: any[],
        parentId: string | null,
        parentPath: string
      ) => {
        for (const item of items) {
          const fileId = `file-${Date.now()}-${Math.random()}`
          const path = parentPath ? `${parentPath}/${item.name}` : item.name
          
          const fileItem: FileItem = {
            id: fileId,
            name: item.name,
            type: item.kind === 'directory' ? 'folder' : 'file',
            parentId,
            path,
            handle: item.handle,
            children: item.kind === 'directory' ? [] : undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          
          files[fileId] = fileItem
          
          // Update parent's children
          if (parentId && files[parentId]) {
            files[parentId].children?.push(fileId)
          }
          
          // Recursively load subdirectories
          if (item.kind === 'directory') {
            const subItems = await fileSystemService.readDirectory(
              item.handle as FileSystemDirectoryHandle,
              path
            )
            await processItems(subItems, fileId, path)
          }
        }
      }
      
      await processItems(items, null, '')
      
      set({ files })
    } catch (error) {
      console.error('Error loading project files:', error)
    }
  },

  // Files
  files: {},
  currentFile: null,
  openTabs: [],
  activeTabId: null,
  
  addFile: async (file) => {
    const { currentProject, files } = get()
    if (!currentProject?.directoryHandle) {
      throw new Error('No project selected')
    }

    try {
      // Get parent handle
      let parentHandle = currentProject.directoryHandle
      if (file.parentId) {
        const parentFile = files[file.parentId]
        if (parentFile?.handle && parentFile.type === 'folder') {
          parentHandle = parentFile.handle as FileSystemDirectoryHandle
        }
      }

      // Create the file or folder
      let handle: FileSystemFileHandle | FileSystemDirectoryHandle
      if (file.type === 'file') {
        handle = await fileSystemService.createFile(
          parentHandle,
          file.name,
          file.content || ''
        )
      } else {
        handle = await fileSystemService.createDirectory(parentHandle, file.name)
      }

      // Add to store
      const newFile: FileItem = {
        ...file,
        id: `file-${Date.now()}-${Math.random()}`,
        handle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        children: file.type === 'folder' ? [] : undefined,
      }

      set((state) => {
        const newFiles = { ...state.files, [newFile.id]: newFile }

        // Update parent's children array
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
    } catch (error) {
      console.error('Error adding file:', error)
      throw error
    }
  },
  
  updateFile: async (fileId, updates) => {
    const { files } = get()
    const file = files[fileId]
    
    if (!file) return

    try {
      // If content is being updated, write to file system
      if (updates.content !== undefined && file.handle && file.type === 'file') {
        await fileSystemService.writeFile(
          file.handle as FileSystemFileHandle,
          updates.content
        )
      }

      set((state) => ({
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
      }))
    } catch (error) {
      console.error('Error updating file:', error)
      throw error
    }
  },
  
  deleteFile: async (fileId) => {
    const { files } = get()
    const file = files[fileId]
    
    if (!file) return

    try {
      // Delete from file system
      if (file.parentId) {
        const parent = files[file.parentId]
        if (parent?.handle && parent.type === 'folder') {
          await fileSystemService.deleteItem(
            parent.handle as FileSystemDirectoryHandle,
            file.name
          )
        }
      } else {
        // Root level - delete from project root
        const { currentProject } = get()
        if (currentProject?.directoryHandle) {
          await fileSystemService.deleteItem(
            currentProject.directoryHandle,
            file.name
          )
        }
      }

      // Remove from store
      set((state) => {
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

        // Delete the file and its children recursively
        const deleteRecursive = (id: string) => {
          const item = newFiles[id]
          if (item?.type === 'folder' && item.children) {
            item.children.forEach(deleteRecursive)
          }
          delete newFiles[id]
        }
        deleteRecursive(fileId)

        return {
          files: newFiles,
          currentFile: state.currentFile?.id === fileId ? null : state.currentFile,
        }
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  },
  
  renameFile: async (fileId, newName) => {
    const { files } = get()
    const file = files[fileId]
    
    if (!file) return

    try {
      // Rename in file system
      if (file.parentId) {
        const parent = files[file.parentId]
        if (parent?.handle && parent.type === 'folder') {
          await fileSystemService.renameItem(
            parent.handle as FileSystemDirectoryHandle,
            file.name,
            newName
          )
        }
      } else {
        const { currentProject } = get()
        if (currentProject?.directoryHandle) {
          await fileSystemService.renameItem(
            currentProject.directoryHandle,
            file.name,
            newName
          )
        }
      }

      // Update in store
      const newPath = file.path.replace(file.name, newName)
      set((state) => ({
        files: {
          ...state.files,
          [fileId]: {
            ...file,
            name: newName,
            path: newPath,
            updatedAt: Date.now(),
          },
        },
      }))
    } catch (error) {
      console.error('Error renaming file:', error)
      throw error
    }
  },
  
  moveFile: async (fileId, newParentId) => {
    const { files } = get()
    const file = files[fileId]
    const newParent = files[newParentId]
    
    if (!file || !newParent || newParent.type !== 'folder') return

    try {
      // Get source and target parent handles
      const sourceParentHandle = file.parentId
        ? (files[file.parentId]?.handle as FileSystemDirectoryHandle)
        : get().currentProject?.directoryHandle
        
      const targetParentHandle = newParent.handle as FileSystemDirectoryHandle

      if (!sourceParentHandle || !targetParentHandle) {
        throw new Error('Invalid parent handles')
      }

      // Move in file system
      await fileSystemService.moveItem(
        sourceParentHandle,
        targetParentHandle,
        file.name
      )

      // Update in store
      set((state) => {
        const newFiles = { ...state.files }

        // Remove from old parent's children
        if (file.parentId && newFiles[file.parentId]) {
          const oldParent = newFiles[file.parentId]
          if (oldParent.children) {
            newFiles[file.parentId] = {
              ...oldParent,
              children: oldParent.children.filter((id) => id !== fileId),
            }
          }
        }

        // Add to new parent's children
        if (newParent.children) {
          newFiles[newParentId] = {
            ...newParent,
            children: [...newParent.children, fileId],
          }
        }

        // Update file's parentId and path
        const newPath = `${newParent.path}/${file.name}`
        newFiles[fileId] = {
          ...file,
          parentId: newParentId,
          path: newPath,
          updatedAt: Date.now(),
        }

        return { files: newFiles }
      })
    } catch (error) {
      console.error('Error moving file:', error)
      throw error
    }
  },
  
  selectFile: async (fileId) => {
    const file = get().files[fileId]
    if (file && file.type === 'file') {
      try {
        // Load content if not already loaded
        if (file.handle && !file.content) {
          const content = await fileSystemService.readFile(
            file.handle as FileSystemFileHandle
          )
          
          // Update file with content
          set((state) => ({
            files: {
              ...state.files,
              [fileId]: {
                ...file,
                content,
              },
            },
            currentFile: {
              ...file,
              content,
            },
          }))
        } else {
          set({ currentFile: file })
        }
      } catch (error) {
        console.error('Error loading file content:', error)
        set({ currentFile: file })
      }
    }
  },
  
  openFileInTab: async (fileId) => {
    const file = get().files[fileId]
    if (file && file.type === 'file') {
      try {
        // Load content if not already loaded
        if (file.handle && !file.content) {
          const content = await fileSystemService.readFile(
            file.handle as FileSystemFileHandle
          )
          
          // Update file with content
          set((state) => {
            const newFiles = {
              ...state.files,
              [fileId]: {
                ...file,
                content,
              },
            }
            
            // Add to open tabs if not already open
            const newOpenTabs = state.openTabs.includes(fileId)
              ? state.openTabs
              : [...state.openTabs, fileId]
            
            return {
              files: newFiles,
              openTabs: newOpenTabs,
              activeTabId: fileId,
              currentFile: newFiles[fileId],
            }
          })
        } else {
          // File already has content
          set((state) => {
            const newOpenTabs = state.openTabs.includes(fileId)
              ? state.openTabs
              : [...state.openTabs, fileId]
            
            return {
              openTabs: newOpenTabs,
              activeTabId: fileId,
              currentFile: file,
            }
          })
        }
      } catch (error) {
        console.error('Error opening file in tab:', error)
      }
    }
  },
  
  closeTab: (fileId) => {
    set((state) => {
      const newOpenTabs = state.openTabs.filter(id => id !== fileId)
      let newActiveTabId = state.activeTabId
      let newCurrentFile = state.currentFile
      
      // If closing the active tab, switch to another tab
      if (state.activeTabId === fileId) {
        if (newOpenTabs.length > 0) {
          // Switch to the last tab
          newActiveTabId = newOpenTabs[newOpenTabs.length - 1]
          newCurrentFile = state.files[newActiveTabId]
        } else {
          newActiveTabId = null
          newCurrentFile = null
        }
      }
      
      return {
        openTabs: newOpenTabs,
        activeTabId: newActiveTabId,
        currentFile: newCurrentFile,
      }
    })
  },
  
  setActiveTab: (fileId) => {
    const file = get().files[fileId]
    if (file) {
      set({
        activeTabId: fileId,
        currentFile: file,
      })
    }
  },
  
  refreshFiles: async () => {
    await get().loadProjectFiles()
  },

  // Chat with persistence
  chatSessions: [],
  currentSession: null,
  
  loadChatThreads: async () => {
    try {
      const threads = await chatPersistence.loadChatThreads()
      set({ chatSessions: threads })
    } catch (error) {
      console.error('Error loading chat threads:', error)
    }
  },
  
  createChatSession: async (name?: string) => {
    try {
      const threadName = name || `Chat ${get().chatSessions.length + 1}`
      const newThread = await chatPersistence.createThread(threadName)
      
      set((state) => ({
        chatSessions: [...state.chatSessions, newThread],
        currentSession: newThread,
      }))
    } catch (error) {
      console.error('Error creating chat session:', error)
      throw error
    }
  },
  
  selectChatSession: (sessionId) => {
    const session = get().chatSessions.find((s) => s.id === sessionId)
    if (session) {
      set({ currentSession: session })
    }
  },
  
  addMessage: async (message) => {
    let currentSession = get().currentSession
    
    // Create a new session if none exists
    if (!currentSession) {
      await get().createChatSession()
      currentSession = get().currentSession
      if (!currentSession) return
    }

    try {
      // Add message to persistence
      await chatPersistence.addMessage(currentSession.id, message)
      
      // Reload threads to get updated data
      await get().loadChatThreads()
      
      // Re-select the current session to update the UI
      const updatedSession = get().chatSessions.find(s => s.id === currentSession!.id)
      if (updatedSession) {
        set({ currentSession: updatedSession })
      }
    } catch (error) {
      console.error('Error adding message:', error)
      throw error
    }
  },
  
  deleteChatSession: async (sessionId) => {
    try {
      await chatPersistence.deleteThread(sessionId)
      
      set((state) => ({
        chatSessions: state.chatSessions.filter((s) => s.id !== sessionId),
        currentSession:
          state.currentSession?.id === sessionId ? null : state.currentSession,
      }))
    } catch (error) {
      console.error('Error deleting chat session:', error)
      throw error
    }
  },
  
  renameChatSession: async (sessionId, newName) => {
    try {
      await chatPersistence.updateThread(sessionId, { name: newName })
      await get().loadChatThreads()
      
      // Update current session if it's the one being renamed
      if (get().currentSession?.id === sessionId) {
        const updatedSession = get().chatSessions.find(s => s.id === sessionId)
        if (updatedSession) {
          set({ currentSession: updatedSession })
        }
      }
    } catch (error) {
      console.error('Error renaming chat session:', error)
      throw error
    }
  },

  // Agents
  orchestrator: null,
  subAgents: [],
  
  updateOrchestrator: (config) => {
    set((state) => {
      const updatedOrchestrator = state.orchestrator
        ? { ...state.orchestrator, ...config }
        : {
            id: 'orchestrator',
            name: 'Orchestrator',
            provider: '',
            apiKey: '',
            model: '',
            systemPrompt: '',
            description: 'Main orchestrator agent that coordinates tasks',
            selectedTools: getDefaultTools(),
            ...config,
          }
      
      // Persist to storage
      settingsPersistence.saveSettings({
        orchestrator: updatedOrchestrator,
      }).catch(error => {
        console.error('Failed to persist orchestrator settings:', error)
      })
      
      return { orchestrator: updatedOrchestrator }
    })
  },
  
  createSubAgent: async (config) => {
    const id = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newAgent: AgentConfig = {
      ...config,
      id,
      selectedTools: config.selectedTools || getDefaultTools(), // Use provided or default
    }
    
    set((state) => {
      const newSubAgents = [...state.subAgents, newAgent]
      
      // Persist to storage
      settingsPersistence.saveSettings({
        subAgents: newSubAgents,
      }).catch(error => {
        console.error('Failed to persist sub-agent settings:', error)
      })
      
      return { subAgents: newSubAgents }
    })
  },
  
  updateSubAgent: async (id, config) => {
    set((state) => {
      const newSubAgents = state.subAgents.map(agent =>
        agent.id === id ? { ...agent, ...config } : agent
      )
      
      // Persist to storage
      settingsPersistence.saveSettings({
        subAgents: newSubAgents,
      }).catch(error => {
        console.error('Failed to persist sub-agent settings:', error)
      })
      
      return { subAgents: newSubAgents }
    })
  },
  
  deleteSubAgent: async (id) => {
    set((state) => {
      const newSubAgents = state.subAgents.filter(agent => agent.id !== id)
      
      // Persist to storage
      settingsPersistence.saveSettings({
        subAgents: newSubAgents,
      }).catch(error => {
        console.error('Failed to persist sub-agent settings:', error)
      })
      
      return { subAgents: newSubAgents }
    })
  },
  
  loadAgentSettings: async () => {
    try {
      const settings = await settingsPersistence.loadSettings()
      
      // Migrate old settings to include selectedTools
      const migratedOrchestrator = settings.orchestrator 
        ? {
            ...settings.orchestrator,
            selectedTools: settings.orchestrator.selectedTools || getDefaultTools()
          }
        : null
      
      const migratedSubAgents = settings.subAgents.map(agent => ({
        ...agent,
        selectedTools: agent.selectedTools || getDefaultTools()
      }))
      
      set({
        orchestrator: migratedOrchestrator,
        subAgents: migratedSubAgents,
      })
    } catch (error) {
      console.error('Failed to load agent settings:', error)
    }
  },
  
  exportAgentSettings: async () => {
    try {
      return await settingsPersistence.exportSettings()
    } catch (error) {
      console.error('Failed to export settings:', error)
      throw error
    }
  },
  
  importAgentSettings: async (jsonString: string) => {
    try {
      await settingsPersistence.importSettings(jsonString)
      // Reload settings after import
      await get().loadAgentSettings()
    } catch (error) {
      console.error('Failed to import settings:', error)
      throw error
    }
  },
  
  clearAgentSettings: async () => {
    try {
      await settingsPersistence.clearSettings()
      set({
        orchestrator: null,
        subAgents: [],
      })
    } catch (error) {
      console.error('Failed to clear settings:', error)
      throw error
    }
  },

  // UI State (unchanged)
  showAgentPanel: false,
  toggleAgentPanel: () => set((state) => ({ showAgentPanel: !state.showAgentPanel })),
}))
