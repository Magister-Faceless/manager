// File System Access API service for working with local files
// Note: This API is only available in modern browsers (Chrome, Edge, etc.)

export interface FileSystemItem {
  name: string
  kind: 'file' | 'directory'
  handle: FileSystemFileHandle | FileSystemDirectoryHandle
  path: string
}

export class FileSystemService {
  private rootHandle: FileSystemDirectoryHandle | null = null

  /**
   * Check if File System Access API is supported
   */
  static isSupported(): boolean {
    return 'showDirectoryPicker' in window
  }

  /**
   * Request user to select a directory
   */
  async selectDirectory(): Promise<{ handle: FileSystemDirectoryHandle; path: string }> {
    if (!FileSystemService.isSupported()) {
      throw new Error('File System Access API is not supported in this browser')
    }

    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
      })
      
      this.rootHandle = handle
      
      return { handle, path: handle.name }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Directory selection was cancelled')
      }
      throw error
    }
  }

  /**
   * Set the root directory handle
   */
  setRootHandle(handle: FileSystemDirectoryHandle) {
    this.rootHandle = handle
  }

  /**
   * Get the root directory handle
   */
  getRootHandle(): FileSystemDirectoryHandle | null {
    return this.rootHandle
  }

  /**
   * Read directory contents recursively
   */
  async readDirectory(
    dirHandle: FileSystemDirectoryHandle,
    parentPath: string = ''
  ): Promise<FileSystemItem[]> {
    const items: FileSystemItem[] = []

    try {
      for await (const entry of dirHandle.values()) {
        const path = parentPath ? `${parentPath}/${entry.name}` : entry.name
        
        items.push({
          name: entry.name,
          kind: entry.kind,
          handle: entry as FileSystemFileHandle | FileSystemDirectoryHandle,
          path,
        })
      }
    } catch (error) {
      console.error('Error reading directory:', error)
      throw new Error('Failed to read directory contents')
    }

    return items
  }

  /**
   * Create a new file
   */
  async createFile(
    parentHandle: FileSystemDirectoryHandle,
    fileName: string,
    content: string = ''
  ): Promise<FileSystemFileHandle> {
    try {
      const fileHandle = await parentHandle.getFileHandle(fileName, { create: true })
      
      // Write initial content
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()
      
      return fileHandle
    } catch (error) {
      console.error('Error creating file:', error)
      throw new Error(`Failed to create file: ${fileName}`)
    }
  }

  /**
   * Create a new directory
   */
  async createDirectory(
    parentHandle: FileSystemDirectoryHandle,
    dirName: string
  ): Promise<FileSystemDirectoryHandle> {
    try {
      return await parentHandle.getDirectoryHandle(dirName, { create: true })
    } catch (error) {
      console.error('Error creating directory:', error)
      throw new Error(`Failed to create directory: ${dirName}`)
    }
  }

  /**
   * Read file content
   */
  async readFile(fileHandle: FileSystemFileHandle): Promise<string> {
    try {
      const file = await fileHandle.getFile()
      return await file.text()
    } catch (error) {
      console.error('Error reading file:', error)
      throw new Error('Failed to read file')
    }
  }

  /**
   * Write file content
   */
  async writeFile(fileHandle: FileSystemFileHandle, content: string): Promise<void> {
    try {
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()
    } catch (error) {
      console.error('Error writing file:', error)
      throw new Error('Failed to write file')
    }
  }

  /**
   * Delete a file or directory
   */
  async deleteItem(
    parentHandle: FileSystemDirectoryHandle,
    name: string
  ): Promise<void> {
    try {
      await parentHandle.removeEntry(name, { recursive: true })
    } catch (error) {
      console.error('Error deleting item:', error)
      throw new Error(`Failed to delete: ${name}`)
    }
  }

  /**
   * Rename a file or directory (by creating new and deleting old)
   */
  async renameItem(
    parentHandle: FileSystemDirectoryHandle,
    oldName: string,
    newName: string
  ): Promise<void> {
    try {
      // Get the old item
      let oldHandle: FileSystemFileHandle | FileSystemDirectoryHandle
      try {
        oldHandle = await parentHandle.getFileHandle(oldName)
      } catch {
        oldHandle = await parentHandle.getDirectoryHandle(oldName)
      }

      if (oldHandle.kind === 'file') {
        // For files: read content, create new file, delete old
        const fileHandle = oldHandle as FileSystemFileHandle
        const content = await this.readFile(fileHandle)
        await this.createFile(parentHandle, newName, content)
        await parentHandle.removeEntry(oldName)
      } else {
        // For directories: more complex - need to copy recursively
        // For now, we'll use a simpler approach
        const newDirHandle = await parentHandle.getDirectoryHandle(newName, { create: true })
        const oldDirHandle = oldHandle as FileSystemDirectoryHandle
        
        // Copy contents recursively
        await this.copyDirectory(oldDirHandle, newDirHandle)
        
        // Delete old directory
        await parentHandle.removeEntry(oldName, { recursive: true })
      }
    } catch (error) {
      console.error('Error renaming item:', error)
      throw new Error(`Failed to rename: ${oldName} to ${newName}`)
    }
  }

  /**
   * Copy directory contents recursively
   */
  private async copyDirectory(
    sourceHandle: FileSystemDirectoryHandle,
    targetHandle: FileSystemDirectoryHandle
  ): Promise<void> {
    for await (const entry of sourceHandle.values()) {
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle
        const content = await this.readFile(fileHandle)
        await this.createFile(targetHandle, entry.name, content)
      } else {
        const dirHandle = entry as FileSystemDirectoryHandle
        const newDirHandle = await targetHandle.getDirectoryHandle(entry.name, { create: true })
        await this.copyDirectory(dirHandle, newDirHandle)
      }
    }
  }

  /**
   * Move a file or directory to a new parent
   */
  async moveItem(
    sourceParentHandle: FileSystemDirectoryHandle,
    targetParentHandle: FileSystemDirectoryHandle,
    itemName: string
  ): Promise<void> {
    try {
      // Get the item to move
      let itemHandle: FileSystemFileHandle | FileSystemDirectoryHandle
      try {
        itemHandle = await sourceParentHandle.getFileHandle(itemName)
      } catch {
        itemHandle = await sourceParentHandle.getDirectoryHandle(itemName)
      }

      if (itemHandle.kind === 'file') {
        // Move file
        const fileHandle = itemHandle as FileSystemFileHandle
        const content = await this.readFile(fileHandle)
        await this.createFile(targetParentHandle, itemName, content)
        await sourceParentHandle.removeEntry(itemName)
      } else {
        // Move directory
        const dirHandle = itemHandle as FileSystemDirectoryHandle
        const newDirHandle = await targetParentHandle.getDirectoryHandle(itemName, { create: true })
        await this.copyDirectory(dirHandle, newDirHandle)
        await sourceParentHandle.removeEntry(itemName, { recursive: true })
      }
    } catch (error) {
      console.error('Error moving item:', error)
      throw new Error(`Failed to move: ${itemName}`)
    }
  }

  /**
   * Get a file or directory handle by path
   */
  async getHandleByPath(
    path: string
  ): Promise<FileSystemFileHandle | FileSystemDirectoryHandle | null> {
    if (!this.rootHandle) return null

    const parts = path.split('/').filter(p => p)
    let currentHandle: FileSystemDirectoryHandle = this.rootHandle

    try {
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        
        if (i === parts.length - 1) {
          // Last part - could be file or directory
          try {
            return await currentHandle.getFileHandle(part)
          } catch {
            return await currentHandle.getDirectoryHandle(part)
          }
        } else {
          // Intermediate part - must be directory
          currentHandle = await currentHandle.getDirectoryHandle(part)
        }
      }
      
      return currentHandle
    } catch (error) {
      console.error('Error getting handle by path:', error)
      return null
    }
  }

  /**
   * Verify permission to access directory
   */
  async verifyPermission(
    handle: FileSystemDirectoryHandle,
    readWrite: boolean = true
  ): Promise<boolean> {
    const options: FileSystemHandlePermissionDescriptor = {
      mode: readWrite ? 'readwrite' : 'read',
    }

    // Check if permission was already granted
    if ((await handle.queryPermission(options)) === 'granted') {
      return true
    }

    // Request permission
    if ((await handle.requestPermission(options)) === 'granted') {
      return true
    }

    return false
  }
}

// Export singleton instance
export const fileSystemService = new FileSystemService()
