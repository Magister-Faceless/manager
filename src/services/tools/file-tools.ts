import { tool } from 'ai'
import { z } from 'zod'
import { fileSystemService } from '@/services/file-system'
import { useStore } from '@/store'

// Helper function to find file by path
function findFileByPath(path: string) {
  const files = useStore.getState().files
  return Object.values(files).find(f => f.path === path)
}

// 1. READ FILE TOOL
export const readFileTool = tool({
  description: 'Read the contents of a file from the current project. Use this when the user asks to view, read, or check file contents.',
  inputSchema: z.object({
    path: z.string().describe('Relative path to the file from project root, e.g., "notes.md" or "docs/readme.md"'),
  }),
  execute: async ({ path }) => {
    try {
      const file = findFileByPath(path)
      
      if (!file || file.type !== 'file') {
        return {
          success: false,
          error: `File not found: ${path}. Use list_files to see available files.`
        }
      }
      
      if (!file.handle) {
        return { success: false, error: 'File handle not available' }
      }
      
      const content = await fileSystemService.readFile(file.handle as FileSystemFileHandle)
      
      return {
        success: true,
        path,
        content,
        size: content.length,
        lines: content.split('\n').length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error reading file'
      }
    }
  }
})

// 2. WRITE FILE TOOL
export const writeFileTool = tool({
  description: 'Write or update content in an existing file. This will replace the entire file content.',
  inputSchema: z.object({
    path: z.string().describe('Path to the file to update'),
    content: z.string().describe('New content to write to the file'),
  }),
  execute: async ({ path, content }) => {
    try {
      const { updateFile } = useStore.getState()
      const file = findFileByPath(path)
      
      if (!file || file.type !== 'file') {
        return { 
          success: false, 
          error: `File not found: ${path}. Use create_file to create a new file.` 
        }
      }
      
      await updateFile(file.id, { content })
      
      return {
        success: true,
        path,
        bytesWritten: content.length,
        message: `Successfully updated ${path}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error writing file'
      }
    }
  }
})

// 3. CREATE FILE TOOL
export const createFileTool = tool({
  description: 'Create a new file with optional initial content. The file will be created on disk.',
  inputSchema: z.object({
    name: z.string().describe('File name including extension (e.g., "notes.md", "data.json")'),
    path: z.string().optional().default('').describe('Parent directory path. Leave empty for root.'),
    content: z.string().optional().default('').describe('Initial file content'),
  }),
  execute: async ({ name, path = '', content = '' }) => {
    try {
      const { files, addFile, currentProject } = useStore.getState()
      
      if (!currentProject) {
        return { success: false, error: 'No project selected' }
      }
      
      // Find parent folder if path specified
      let parentFolder = null
      if (path !== '') {
        parentFolder = Object.values(files).find(f => f.path === path && f.type === 'folder')
        if (!parentFolder) {
          return { success: false, error: `Parent folder not found: ${path}` }
        }
      }
      
      const fullPath = path ? `${path}/${name}` : name
      
      // Check if file already exists
      const existingFile = findFileByPath(fullPath)
      if (existingFile) {
        return { 
          success: false, 
          error: `File already exists: ${fullPath}. Use write_file to update it.` 
        }
      }
      
      await addFile({
        name,
        type: 'file',
        parentId: parentFolder?.id || null,
        path: fullPath,
        content
      })
      
      // Verify file was created
      const createdFile = findFileByPath(fullPath)
      
      return {
        success: true,
        path: fullPath,
        message: `Successfully created file: ${fullPath}`,
        size: content.length,
        verified: !!createdFile
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating file'
      }
    }
  }
})

// 4. CREATE FOLDER TOOL
export const createFolderTool = tool({
  description: 'Create a new folder/directory in the project.',
  inputSchema: z.object({
    name: z.string().describe('Folder name (e.g., "docs", "resources")'),
    path: z.string().optional().default('').describe('Parent directory path. Leave empty for root.'),
  }),
  execute: async ({ name, path = '' }) => {
    try {
      const { files, addFile, currentProject } = useStore.getState()
      
      if (!currentProject) {
        return { success: false, error: 'No project selected' }
      }
      
      // Find parent folder if path specified
      let parentFolder = null
      if (path !== '') {
        parentFolder = Object.values(files).find(f => f.path === path && f.type === 'folder')
        if (!parentFolder) {
          return { success: false, error: `Parent folder not found: ${path}` }
        }
      }
      
      const fullPath = path ? `${path}/${name}` : name
      
      // Check if folder already exists
      const existingFolder = findFileByPath(fullPath)
      if (existingFolder) {
        return { success: false, error: `Folder already exists: ${fullPath}` }
      }
      
      await addFile({
        name,
        type: 'folder',
        parentId: parentFolder?.id || null,
        path: fullPath,
      })
      
      // Verify folder was created
      const createdFolder = findFileByPath(fullPath)
      
      return {
        success: true,
        path: fullPath,
        name: name,
        message: `Successfully created folder: ${name} at ${fullPath}`,
        verified: !!createdFolder
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating folder'
      }
    }
  }
})

// 5. LIST FILES TOOL
export const listFilesTool = tool({
  description: 'List all files and folders in a directory. Use this to explore the project structure.',
  inputSchema: z.object({
    path: z.string().optional().default('').describe('Directory path. Leave empty to list root directory.'),
    recursive: z.boolean().optional().default(false).describe('Include subdirectories and their contents'),
  }),
  execute: async ({ path = '', recursive = false }) => {
    try {
      const files = useStore.getState().files
      const allFiles = Object.values(files)
      
      let results
      
      if (path === '') {
        // List root level
        results = allFiles.filter(f => f.parentId === null)
      } else {
        // Find the target folder
        const targetFolder = allFiles.find(f => f.path === path && f.type === 'folder')
        if (!targetFolder) {
          return { success: false, error: `Folder not found: ${path}` }
        }
        
        if (recursive) {
          // Get all descendants
          results = allFiles.filter(f => f.path.startsWith(path + '/'))
        } else {
          // Get direct children only
          results = allFiles.filter(f => f.parentId === targetFolder.id)
        }
      }
      
      const fileList = results.map(f => ({
        name: f.name,
        path: f.path,
        type: f.type,
        size: f.content?.length || 0,
        modified: new Date(f.updatedAt).toISOString()
      }))
      
      return {
        success: true,
        files: fileList,
        totalCount: fileList.length,
        folders: fileList.filter(f => f.type === 'folder').length,
        regularFiles: fileList.filter(f => f.type === 'file').length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error listing files'
      }
    }
  }
})
