import {
  readFileTool,
  writeFileTool,
  createFileTool,
  createFolderTool,
  listFilesTool,
} from './file-tools'

export const tools = {
  read_file: readFileTool,
  write_file: writeFileTool,
  create_file: createFileTool,
  create_folder: createFolderTool,
  list_files: listFilesTool,
}

export default tools
