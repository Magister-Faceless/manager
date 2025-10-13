import { create } from 'zustand'
import { fileSystemService } from '@/services/file-system'

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
    
    // Load files after setting project
    if (newProject.directoryHandle) {
      fileSystemService.setRootHandle(newProject.directoryHandle)
      get().loadProjectFiles()
    }
  },
  
  selectProject: async (projectId) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (project) {
      set({ currentProject: project, files: {}, currentFile: null })
      
      // Set the file system root and load files
      if (project.directoryHandle) {
        fileSystemService.setRootHandle(project.directoryHandle)
        await get().loadProjectFiles()
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

  // Chat (unchanged)
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

  // Agents (unchanged)
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

  // UI State (unchanged)
  showAgentPanel: false,
  toggleAgentPanel: () => set((state) => ({ showAgentPanel: !state.showAgentPanel })),
}))
