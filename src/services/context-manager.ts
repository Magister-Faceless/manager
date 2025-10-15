/**
 * Context Manager Service
 * 
 * Manages the .agent/ folder for persistent agent context and memory.
 * This folder is visible to users and contains agent working memory.
 */

import { fileSystemService } from './file-system'
import type { ContextCategory } from '@/types/context'

export class ContextManager {
  private rootHandle: FileSystemDirectoryHandle | null = null
  private agentFolderHandle: FileSystemDirectoryHandle | null = null

  /**
   * Set the project root directory handle
   */
  setRootHandle(handle: FileSystemDirectoryHandle) {
    this.rootHandle = handle
    this.agentFolderHandle = null // Reset agent folder handle
  }

  /**
   * Initialize the .agent/ folder structure
   * Creates folder and README if they don't exist
   * If folder already exists (existing project), opens it without errors
   */
  async initializeAgentFolder(): Promise<void> {
    if (!this.rootHandle) {
      throw new Error('Root handle not set')
    }
    
    try {
      // Check if .agent/ folder already exists
      let folderExists = false
      try {
        await this.rootHandle.getDirectoryHandle('.agent')
        folderExists = true
      } catch {
        folderExists = false
      }
      
      // Get or create .agent/ folder (create: true means it will create only if needed)
      this.agentFolderHandle = await this.rootHandle.getDirectoryHandle('.agent', {
        create: true
      })
      
      if (folderExists) {
        console.log('📂 Existing .agent/ folder found - opening existing project context')
      } else {
        console.log('📁 Creating new .agent/ folder - initializing project context')
      }
      
      // Create README.md if it doesn't exist (won't overwrite existing)
      await this.createReadmeIfNotExists()
      
      // Ensure subdirectories exist (won't error if they already exist)
      await this.agentFolderHandle.getDirectoryHandle('research', { create: true })
      await this.agentFolderHandle.getDirectoryHandle('sessions', { create: true })
      
      console.log('✅ Agent folder ready')
    } catch (error) {
      console.error('❌ Error initializing agent folder:', error)
      throw error
    }
  }

  /**
   * Create README.md in .agent/ folder explaining its purpose
   * Only creates if it doesn't already exist (won't overwrite)
   */
  private async createReadmeIfNotExists(): Promise<void> {
    if (!this.agentFolderHandle) return
    
    try {
      // Check if README already exists
      await this.agentFolderHandle.getFileHandle('README.md')
      // If we get here, file exists, don't overwrite
      console.log('  📄 README.md already exists - preserving existing file')
      return
    } catch {
      // File doesn't exist, create it
      console.log('  📝 Creating README.md')
      const readme = `# Agent Working Directory

This folder is used by the AI orchestrator agent to maintain context and memory across sessions.

## Contents

- **architecture.md** - Project understanding and architectural notes
- **progress.md** - Session-by-session progress tracking
- **research.md** - Research findings and analysis
- **tasks.md** - Task planning and tracking (future)
- **notes.md** - General notes and observations
- **research/** - Detailed research notes
- **sessions/** - Individual session logs

## Purpose

The orchestrator uses this folder to:
1. Remember what it learned about your project
2. Track progress on multi-step tasks
3. Maintain context between sessions
4. Store research and findings

You can review these files to see what the agent is "thinking" and "remembering".

## Important

These files are managed by the agent. Manual edits may work but could confuse the agent's understanding. It's best to let the agent manage these files and use them as read-only reference.

## Privacy

These files are stored locally in your project directory. They never leave your machine unless you explicitly share or sync your project folder.
`
      
      const fileHandle = await this.agentFolderHandle.getFileHandle('README.md', {
        create: true
      })
      await fileSystemService.writeFile(fileHandle, readme)
    }
  }

  /**
   * Write a context note to a category file
   * 
   * @param category - The context category (architecture, progress, etc.)
   * @param title - Title of the note
   * @param content - Note content (Markdown supported)
   * @param append - If true, append to existing content; if false, replace
   */
  async writeContextNote(
    category: ContextCategory,
    title: string,
    content: string,
    append: boolean = false
  ): Promise<void> {
    if (!this.agentFolderHandle) {
      throw new Error('Agent folder not initialized. Call initializeAgentFolder() first.')
    }

    const fileName = `${category}.md`
    
    try {
      const fileHandle = await this.agentFolderHandle.getFileHandle(fileName, {
        create: true
      })

      let finalContent = content
      
      if (append) {
        // Read existing content and append
        try {
          const existingContent = await fileSystemService.readFile(fileHandle)
          if (existingContent && existingContent.trim()) {
            finalContent = existingContent + '\n\n---\n\n' + content
          }
        } catch (error) {
          // File might be empty or unreadable, just use new content
          console.log('No existing content to append to, creating new')
        }
      }

      // Add metadata header
      const timestamp = new Date().toISOString()
      const formattedDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      const fullContent = `# ${title}\n\n**Last Updated**: ${formattedDate}\n**Timestamp**: ${timestamp}\n\n${finalContent}`

      await fileSystemService.writeFile(fileHandle, fullContent)
      console.log(`✅ Context note saved to ${fileName}`)
    } catch (error) {
      console.error('Error writing context note:', error)
      throw error
    }
  }

  /**
   * Read a context note from a category file
   * 
   * @param category - The context category to read
   * @returns The file content, or null if file doesn't exist
   */
  async readContextNote(category: ContextCategory): Promise<string | null> {
    if (!this.agentFolderHandle) {
      throw new Error('Agent folder not initialized')
    }

    const fileName = `${category}.md`
    
    try {
      const fileHandle = await this.agentFolderHandle.getFileHandle(fileName)
      const content = await fileSystemService.readFile(fileHandle)
      return content
    } catch (error) {
      // File doesn't exist
      return null
    }
  }

  /**
   * List all context notes that exist
   * 
   * @returns Object mapping each category to whether it exists
   */
  async listContextNotes(): Promise<Record<ContextCategory, boolean>> {
    if (!this.agentFolderHandle) {
      throw new Error('Agent folder not initialized')
    }

    const categories: ContextCategory[] = ['architecture', 'progress', 'research', 'tasks', 'notes']
    const result: Record<string, boolean> = {}

    for (const category of categories) {
      try {
        await this.agentFolderHandle.getFileHandle(`${category}.md`)
        result[category] = true
      } catch {
        result[category] = false
      }
    }

    return result as Record<ContextCategory, boolean>
  }

  /**
   * Log progress for the current session
   * 
   * @param summary - Brief summary of progress
   * @param details - Optional achievements, next steps, and blockers
   */
  async logProgress(summary: string, details?: {
    achievements?: string[]
    nextSteps?: string[]
    blockers?: string[]
  }): Promise<void> {
    if (!this.agentFolderHandle) {
      throw new Error('Agent folder not initialized')
    }

    const formattedDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    let progressEntry = `## ${formattedDate}\n\n${summary}\n`

    if (details?.achievements && details.achievements.length > 0) {
      progressEntry += '\n**Achievements:**\n'
      details.achievements.forEach(achievement => {
        progressEntry += `- ✅ ${achievement}\n`
      })
    }

    if (details?.nextSteps && details.nextSteps.length > 0) {
      progressEntry += '\n**Next Steps:**\n'
      details.nextSteps.forEach(step => {
        progressEntry += `- 🔜 ${step}\n`
      })
    }

    if (details?.blockers && details.blockers.length > 0) {
      progressEntry += '\n**Blockers:**\n'
      details.blockers.forEach(blocker => {
        progressEntry += `- ⚠️ ${blocker}\n`
      })
    }

    progressEntry += '\n---\n'

    // Always append to progress log
    await this.writeContextNote('progress', 'Progress Log', progressEntry, true)
  }

  /**
   * Get the agent folder handle (for advanced use cases)
   */
  getAgentFolderHandle(): FileSystemDirectoryHandle | null {
    return this.agentFolderHandle
  }

  /**
   * Check if agent folder is initialized
   */
  isInitialized(): boolean {
    return this.agentFolderHandle !== null
  }
}

// Singleton instance
export const contextManager = new ContextManager()
