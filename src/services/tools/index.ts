import {
  readFileTool,
  writeFileTool,
  createFileTool,
  createFolderTool,
  listFilesTool,
} from './file-tools'

import {
  writeContextNoteTool,
  readContextNoteTool,
  listContextNotesTool,
  logProgressTool,
} from './context-tools'

// Export tool registry for dynamic tool selection
export * from './tool-registry'

// Legacy export for backwards compatibility
// (Will be replaced by dynamic tool selection via buildToolSet)
export const tools = {
  read_file: readFileTool,
  write_file: writeFileTool,
  create_file: createFileTool,
  create_folder: createFolderTool,
  list_files: listFilesTool,
  write_context_note: writeContextNoteTool,
  read_context_note: readContextNoteTool,
  list_context_notes: listContextNotesTool,
  log_progress: logProgressTool,
}

export default tools
