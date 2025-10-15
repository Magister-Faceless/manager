export interface ChatThread {
  id: string
  name: string
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }>
  createdAt: number
  updatedAt: number
}

export interface ChatThreadsData {
  threads: ChatThread[]
  version: string
}

const MANAGER_FOLDER = '.manager'
const CHAT_THREADS_FILE = 'chat-threads.json'

class ChatPersistenceService {
  private rootHandle: FileSystemDirectoryHandle | null = null

  setRootHandle(handle: FileSystemDirectoryHandle) {
    this.rootHandle = handle
  }

  /**
   * Ensure .manager folder exists in the project root
   */
  private async ensureManagerFolder(): Promise<FileSystemDirectoryHandle> {
    if (!this.rootHandle) {
      throw new Error('Root directory handle not set')
    }

    try {
      // Try to get existing .manager folder
      return await this.rootHandle.getDirectoryHandle(MANAGER_FOLDER)
    } catch {
      // Create .manager folder if it doesn't exist
      return await this.rootHandle.getDirectoryHandle(MANAGER_FOLDER, { create: true })
    }
  }

  /**
   * Load chat threads from the project's .manager folder
   */
  async loadChatThreads(): Promise<ChatThread[]> {
    try {
      const managerFolder = await this.ensureManagerFolder()
      
      try {
        // Try to get the chat threads file
        const fileHandle = await managerFolder.getFileHandle(CHAT_THREADS_FILE)
        const file = await fileHandle.getFile()
        const content = await file.text()
        
        const data: ChatThreadsData = JSON.parse(content)
        return data.threads || []
      } catch {
        // File doesn't exist yet, return empty array
        return []
      }
    } catch (error) {
      console.error('Error loading chat threads:', error)
      return []
    }
  }

  /**
   * Save chat threads to the project's .manager folder
   */
  async saveChatThreads(threads: ChatThread[]): Promise<void> {
    try {
      const managerFolder = await this.ensureManagerFolder()
      
      const data: ChatThreadsData = {
        threads,
        version: '1.0.0',
      }
      
      const content = JSON.stringify(data, null, 2)
      
      // Get or create the file
      const fileHandle = await managerFolder.getFileHandle(CHAT_THREADS_FILE, { create: true })
      
      // Write the content
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()
    } catch (error) {
      console.error('Error saving chat threads:', error)
      throw error
    }
  }

  /**
   * Create a new chat thread
   */
  async createThread(name: string): Promise<ChatThread> {
    const threads = await this.loadChatThreads()
    
    const newThread: ChatThread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    
    threads.push(newThread)
    await this.saveChatThreads(threads)
    
    return newThread
  }

  /**
   * Update an existing chat thread
   */
  async updateThread(threadId: string, updates: Partial<ChatThread>): Promise<void> {
    const threads = await this.loadChatThreads()
    const index = threads.findIndex(t => t.id === threadId)
    
    if (index === -1) {
      throw new Error(`Thread ${threadId} not found`)
    }
    
    threads[index] = {
      ...threads[index],
      ...updates,
      updatedAt: Date.now(),
    }
    
    await this.saveChatThreads(threads)
  }

  /**
   * Delete a chat thread
   */
  async deleteThread(threadId: string): Promise<void> {
    const threads = await this.loadChatThreads()
    const filteredThreads = threads.filter(t => t.id !== threadId)
    
    await this.saveChatThreads(filteredThreads)
  }

  /**
   * Add a message to a thread
   */
  async addMessage(
    threadId: string,
    message: { role: 'user' | 'assistant'; content: string }
  ): Promise<void> {
    const threads = await this.loadChatThreads()
    const thread = threads.find(t => t.id === threadId)
    
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`)
    }
    
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: message.role,
      content: message.content,
      timestamp: Date.now(),
    }
    
    thread.messages.push(newMessage)
    thread.updatedAt = Date.now()
    
    await this.saveChatThreads(threads)
  }
}

export const chatPersistence = new ChatPersistenceService()
