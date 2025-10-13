# Tools Reference Guide

Complete reference for all 37 tools planned for Manager App.

## Tool Categories

### 🗂️ File Operations (10 tools)

#### 1. read_file
```typescript
{
  name: 'read_file',
  description: 'Read the contents of a file',
  parameters: {
    path: 'Relative path to file from project root'
  },
  returns: {
    success: boolean,
    content: string,
    size: number,
    lastModified: number
  }
}
```
**Use cases:** View file content, analyze code, read documentation
**Example:** "Read the content of README.md"

#### 2. write_file
```typescript
{
  name: 'write_file',
  description: 'Write or update content in a file',
  parameters: {
    path: 'Path to file',
    content: 'New content to write',
    mode: 'overwrite | append'
  },
  returns: {
    success: boolean,
    bytesWritten: number
  }
}
```
**Use cases:** Update files, save generated content, edit documents
**Example:** "Add a conclusion section to report.md"

#### 3. create_file
```typescript
{
  name: 'create_file',
  description: 'Create a new file with optional initial content',
  parameters: {
    directory: 'Parent directory path',
    name: 'File name with extension',
    content: 'Initial content (optional)',
    fileType: 'File extension (.txt, .md, .py, etc.)'
  },
  returns: {
    success: boolean,
    path: string,
    created: boolean
  }
}
```
**Use cases:** Create new documents, initialize files, add resources
**Example:** "Create a file called notes.md in the research folder"

#### 4. delete_file
```typescript
{
  name: 'delete_file',
  description: 'Delete a file from the project',
  parameters: {
    path: 'Path to file to delete',
    confirmDeletion: 'Safety confirmation (required)'
  },
  returns: {
    success: boolean,
    deleted: boolean
  }
}
```
**Use cases:** Remove obsolete files, clean up workspace
**Example:** "Delete temp.txt"

#### 5. rename_file
```typescript
{
  name: 'rename_file',
  description: 'Rename a file or folder',
  parameters: {
    oldPath: 'Current path',
    newName: 'New name (without path)',
  },
  returns: {
    success: boolean,
    newPath: string
  }
}
```
**Use cases:** Organize files, fix naming, restructure
**Example:** "Rename draft1.md to final-report.md"

#### 6. move_file
```typescript
{
  name: 'move_file',
  description: 'Move a file or folder to a different location',
  parameters: {
    sourcePath: 'Current path',
    destinationFolder: 'Target folder path',
  },
  returns: {
    success: boolean,
    newPath: string
  }
}
```
**Use cases:** Reorganize structure, archive files
**Example:** "Move report.pdf to the archive folder"

#### 7. list_files
```typescript
{
  name: 'list_files',
  description: 'List all files and folders in a directory',
  parameters: {
    directory: 'Path to directory (empty for root)',
    recursive: 'Include subdirectories (boolean)',
    fileTypesOnly: 'Filter by file types (optional array)'
  },
  returns: {
    success: boolean,
    files: Array<FileInfo>,
    totalCount: number
  }
}
```
**Use cases:** Explore structure, inventory files, find content
**Example:** "What files are in the research folder?"

#### 8. create_folder
```typescript
{
  name: 'create_folder',
  description: 'Create a new folder',
  parameters: {
    parentPath: 'Parent directory path',
    name: 'Folder name',
  },
  returns: {
    success: boolean,
    path: string
  }
}
```
**Use cases:** Organize project, create structure
**Example:** "Create a folder called 'images' in the assets directory"

#### 9. delete_folder
```typescript
{
  name: 'delete_folder',
  description: 'Delete a folder and all its contents',
  parameters: {
    path: 'Path to folder',
    confirmDeletion: 'Safety confirmation (required)',
    recursive: 'Delete contents too (boolean)'
  },
  returns: {
    success: boolean,
    deleted: boolean,
    itemsDeleted: number
  }
}
```
**Use cases:** Remove unused directories, clean project
**Example:** "Delete the old-drafts folder"

#### 10. read_folder
```typescript
{
  name: 'read_folder',
  description: 'Read complete folder structure with metadata',
  parameters: {
    path: 'Folder path',
    depth: 'How many levels deep to read (number)'
  },
  returns: {
    success: boolean,
    structure: FolderTree,
    totalFiles: number,
    totalFolders: number
  }
}
```
**Use cases:** Understand organization, analyze structure
**Example:** "Show me the complete structure of the project"

---

### 🔍 Search & Analysis (4 tools)

#### 11. search_files
```typescript
{
  name: 'search_files',
  description: 'Search for files by name pattern',
  parameters: {
    pattern: 'Search pattern (supports wildcards *)',
    directory: 'Where to search (optional)',
    caseSensitive: 'Case-sensitive search (boolean)'
  },
  returns: {
    success: boolean,
    matches: Array<FileInfo>,
    count: number
  }
}
```
**Use cases:** Find files by name, locate resources
**Example:** "Find all markdown files"

#### 12. grep_content
```typescript
{
  name: 'grep_content',
  description: 'Search for text content within files',
  parameters: {
    searchText: 'Text to search for',
    filePattern: 'Which files to search (optional)',
    caseSensitive: 'Case-sensitive (boolean)',
    contextLines: 'Lines of context to show (number)'
  },
  returns: {
    success: boolean,
    matches: Array<{file: string, line: number, content: string}>,
    totalMatches: number
  }
}
```
**Use cases:** Find specific content, search documentation, locate references
**Example:** "Find all files mentioning 'machine learning'"

#### 13. find_and_replace
```typescript
{
  name: 'find_and_replace',
  description: 'Find and replace text across files',
  parameters: {
    findText: 'Text to find',
    replaceText: 'Text to replace with',
    filePattern: 'Which files to modify',
    caseSensitive: 'Case-sensitive (boolean)',
    confirmEach: 'Confirm each replacement (boolean)'
  },
  returns: {
    success: boolean,
    filesModified: number,
    replacements: number,
    changes: Array<ChangeInfo>
  }
}
```
**Use cases:** Bulk updates, refactoring, corrections
**Example:** "Replace 'TODO' with 'DONE' in all markdown files"

#### 14. get_file_info
```typescript
{
  name: 'get_file_info',
  description: 'Get detailed metadata about a file',
  parameters: {
    path: 'Path to file'
  },
  returns: {
    success: boolean,
    name: string,
    size: number,
    created: number,
    modified: number,
    type: string,
    extension: string
  }
}
```
**Use cases:** Check file details, verify existence, get metadata
**Example:** "When was report.pdf last modified?"

---

### 📊 Project Management (4 tools)

#### 15. list_projects
```typescript
{
  name: 'list_projects',
  description: 'List all available projects',
  parameters: {},
  returns: {
    success: boolean,
    projects: Array<ProjectInfo>,
    currentProject: string
  }
}
```
**Use cases:** View all projects, switch context
**Example:** "What projects do I have?"

#### 16. create_project
```typescript
{
  name: 'create_project',
  description: 'Create a new project',
  parameters: {
    name: 'Project name',
    folderPath: 'Path to project folder',
    template: 'Optional template to use'
  },
  returns: {
    success: boolean,
    projectId: string,
    path: string
  }
}
```
**Use cases:** Start new projects, initialize workspace
**Example:** "Create a new project called 'Research 2024'"

#### 17. switch_project
```typescript
{
  name: 'switch_project',
  description: 'Switch to a different project',
  parameters: {
    projectId: 'ID of project to switch to'
  },
  returns: {
    success: boolean,
    currentProject: string,
    filesLoaded: number
  }
}
```
**Use cases:** Change working context, access different project
**Example:** "Switch to my writing project"

#### 18. get_project_structure
```typescript
{
  name: 'get_project_structure',
  description: 'Get complete folder tree of current project',
  parameters: {
    includeHidden: 'Include hidden files (boolean)',
    maxDepth: 'Maximum depth to traverse'
  },
  returns: {
    success: boolean,
    structure: TreeStructure,
    statistics: ProjectStats
  }
}
```
**Use cases:** Understand organization, plan restructuring
**Example:** "Show me the complete structure of this project"

---

### 📝 Editor Operations (4 tools)

#### 19. open_file_in_tab
```typescript
{
  name: 'open_file_in_tab',
  description: 'Open a file in the editor',
  parameters: {
    path: 'Path to file to open'
  },
  returns: {
    success: boolean,
    tabId: string,
    content: string
  }
}
```
**Use cases:** View files, start editing, review content
**Example:** "Open README.md for editing"

#### 20. close_tab
```typescript
{
  name: 'close_tab',
  description: 'Close an open editor tab',
  parameters: {
    tabId: 'ID of tab to close',
    saveChanges: 'Save before closing (boolean)'
  },
  returns: {
    success: boolean,
    saved: boolean
  }
}
```
**Use cases:** Clean up workspace, manage open files
**Example:** "Close all tabs"

#### 21. get_open_tabs
```typescript
{
  name: 'get_open_tabs',
  description: 'List all currently open editor tabs',
  parameters: {},
  returns: {
    success: boolean,
    tabs: Array<TabInfo>,
    activeTab: string
  }
}
```
**Use cases:** Check what's open, manage workspace
**Example:** "What files do I have open?"

#### 22. switch_to_tab
```typescript
{
  name: 'switch_to_tab',
  description: 'Switch to a specific open tab',
  parameters: {
    tabId: 'ID of tab to switch to'
  },
  returns: {
    success: boolean,
    activeTab: string
  }
}
```
**Use cases:** Navigate between files, focus on specific file
**Example:** "Switch to the notes.md tab"

---

### 📄 Content Generation (3 tools)

#### 23. generate_file_from_template
```typescript
{
  name: 'generate_file_from_template',
  description: 'Create a file from a template',
  parameters: {
    template: 'Template name or content',
    outputPath: 'Where to create file',
    variables: 'Template variables (object)'
  },
  returns: {
    success: boolean,
    path: string,
    content: string
  }
}
```
**Use cases:** Create standardized documents, initialize files
**Example:** "Create a research paper template"

#### 24. create_multiple_files
```typescript
{
  name: 'create_multiple_files',
  description: 'Create multiple files at once',
  parameters: {
    files: Array<{path: string, name: string, content: string}>
  },
  returns: {
    success: boolean,
    filesCreated: number,
    paths: string[]
  }
}
```
**Use cases:** Batch creation, initialize project structure
**Example:** "Create a standard project structure with folders and readme files"

#### 25. append_to_file
```typescript
{
  name: 'append_to_file',
  description: 'Append content to an existing file',
  parameters: {
    path: 'Path to file',
    content: 'Content to append',
    newline: 'Add newline before content (boolean)'
  },
  returns: {
    success: boolean,
    newSize: number
  }
}
```
**Use cases:** Add entries, update logs, extend documents
**Example:** "Add a new entry to changelog.md"

---

### 📈 Analysis & Context (4 tools)

#### 26. analyze_project_structure
```typescript
{
  name: 'analyze_project_structure',
  description: 'Analyze and provide insights about project structure',
  parameters: {},
  returns: {
    success: boolean,
    summary: string,
    folders: number,
    files: number,
    fileTypes: object,
    suggestions: string[]
  }
}
```
**Use cases:** Understand project, get recommendations
**Example:** "Analyze my project structure"

#### 27. get_file_statistics
```typescript
{
  name: 'get_file_statistics',
  description: 'Get statistics about files in project',
  parameters: {
    path: 'Path to analyze (optional)'
  },
  returns: {
    success: boolean,
    totalFiles: number,
    totalSize: number,
    byType: object,
    largest: Array<FileInfo>,
    oldest: Array<FileInfo>,
    newest: Array<FileInfo>
  }
}
```
**Use cases:** Understand content, identify patterns
**Example:** "What types of files are in my project?"

#### 28. read_multiple_files
```typescript
{
  name: 'read_multiple_files',
  description: 'Read content of multiple files at once',
  parameters: {
    paths: Array<string>,
    maxSizePerFile: 'Max size to read per file (optional)'
  },
  returns: {
    success: boolean,
    files: Array<{path: string, content: string, size: number}>,
    totalSize: number
  }
}
```
**Use cases:** Gather context, compare files, bulk analysis
**Example:** "Read all markdown files in the docs folder"

#### 29. get_recent_files
```typescript
{
  name: 'get_recent_files',
  description: 'Get recently modified files',
  parameters: {
    count: 'Number of files to return',
    fileTypes: 'Filter by types (optional)'
  },
  returns: {
    success: boolean,
    files: Array<FileInfo>,
    count: number
  }
}
```
**Use cases:** Continue work, find recent changes
**Example:** "What files did I work on recently?"

---

### 🤝 Collaboration & Memory (4 tools)

#### 30. save_context
```typescript
{
  name: 'save_context',
  description: 'Save important information to memory',
  parameters: {
    key: 'Memory key',
    value: 'Data to save',
    scope: 'session | project | global'
  },
  returns: {
    success: boolean,
    key: string
  }
}
```
**Use cases:** Remember user preferences, store decisions
**Example:** "Remember that the user prefers detailed explanations"

#### 31. retrieve_context
```typescript
{
  name: 'retrieve_context',
  description: 'Retrieve saved context from memory',
  parameters: {
    key: 'Memory key',
    scope: 'session | project | global'
  },
  returns: {
    success: boolean,
    value: any,
    found: boolean
  }
}
```
**Use cases:** Recall preferences, access saved data
**Example:** "What writing style does the user prefer?"

#### 32. share_with_agent
```typescript
{
  name: 'share_with_agent',
  description: 'Share information with another agent',
  parameters: {
    targetAgent: 'Agent ID',
    data: 'Data to share',
    priority: 'low | normal | high'
  },
  returns: {
    success: boolean,
    messageId: string
  }
}
```
**Use cases:** Coordinate between agents, pass context
**Example:** "Send the research findings to the writing agent"

#### 33. delegate_task
```typescript
{
  name: 'delegate_task',
  description: 'Assign a task to a specialized agent',
  parameters: {
    targetAgent: 'Agent ID',
    task: 'Task description',
    context: 'Additional context (optional)',
    priority: 'low | normal | high | urgent'
  },
  returns: {
    success: boolean,
    taskId: string,
    assignedTo: string
  }
}
```
**Use cases:** Multi-agent collaboration, specialized tasks
**Example:** "Ask the research agent to find papers on AI safety"

---

### ⚙️ Specialized Tools (4 tools)

#### 34. execute_command
```typescript
{
  name: 'execute_command',
  description: 'Execute a shell command (with safety checks)',
  parameters: {
    command: 'Command to execute',
    workingDirectory: 'Where to run (optional)',
    confirmDangerous: 'Confirm if command is potentially dangerous'
  },
  returns: {
    success: boolean,
    output: string,
    exitCode: number,
    duration: number
  }
}
```
**Use cases:** Run scripts, build commands, system operations
**Example:** "Run npm install"
**Note:** Requires user confirmation for dangerous operations

#### 35. install_dependency
```typescript
{
  name: 'install_dependency',
  description: 'Install a package dependency',
  parameters: {
    packageName: 'Package to install',
    version: 'Specific version (optional)',
    manager: 'npm | yarn | pnpm | pip | etc.'
  },
  returns: {
    success: boolean,
    installed: string,
    version: string
  }
}
```
**Use cases:** Add dependencies for coding projects
**Example:** "Install the axios package"

#### 36. run_tests
```typescript
{
  name: 'run_tests',
  description: 'Execute test suites',
  parameters: {
    testPath: 'Specific test file (optional)',
    framework: 'Test framework being used'
  },
  returns: {
    success: boolean,
    passed: number,
    failed: number,
    duration: number,
    results: TestResults
  }
}
```
**Use cases:** Verify code, check functionality
**Example:** "Run all tests"

#### 37. git_operations
```typescript
{
  name: 'git_operations',
  description: 'Perform git operations',
  parameters: {
    operation: 'status | commit | push | pull | log | etc.',
    message: 'Commit message (for commit)',
    files: 'Files to stage (for commit)'
  },
  returns: {
    success: boolean,
    output: string,
    branch: string
  }
}
```
**Use cases:** Version control, track changes
**Example:** "Commit changes with message 'Updated documentation'"

---

## Tool Usage Patterns

### Sequential Operations
```typescript
// Agent plans and executes multiple steps
1. search_files('*.md')
2. read_multiple_files(results)
3. analyze_project_structure()
4. create_file('summary.md', content)
```

### Parallel Operations
```typescript
// Execute independent operations simultaneously
await Promise.all([
  readFileTool({ path: 'file1.md' }),
  readFileTool({ path: 'file2.md' }),
  readFileTool({ path: 'file3.md' })
])
```

### Conditional Operations
```typescript
// Agent decides based on results
const structure = await analyzeProjectStructure()
if (structure.folders === 0) {
  await createFolder({ name: 'docs' })
  await createFolder({ name: 'src' })
}
```

### Multi-Agent Collaboration
```typescript
// Orchestrator delegates to specialists
1. Orchestrator: analyze task
2. delegateTask('research-agent', 'Find papers on X')
3. delegateTask('writing-agent', 'Write summary')
4. Orchestrator: combine results
```

---

## Error Handling

All tools return consistent error format:
```typescript
{
  success: false,
  error: 'Human-readable error message',
  errorCode: 'ERROR_CODE',
  details: { /* additional info */ }
}
```

Common error codes:
- `FILE_NOT_FOUND`
- `PERMISSION_DENIED`
- `INVALID_PATH`
- `OPERATION_FAILED`
- `NO_PROJECT_SELECTED`

---

## Performance Considerations

### Tool Optimization
- **Caching**: Frequently accessed files are cached
- **Lazy Loading**: Content loaded only when needed
- **Batch Operations**: Use bulk tools when possible
- **Rate Limiting**: API calls are throttled

### Best Practices
1. Use `list_files` before `read_multiple_files` to filter
2. Set `maxDepth` when reading large folders
3. Use `search_files` instead of listing all files
4. Cache results in agent memory for repeated access
5. Use `append_to_file` instead of read-modify-write

---

## Security & Validation

### Path Validation
All paths are validated to ensure:
- Stay within project folder
- No path traversal attacks
- Valid characters only

### Operation Confirmation
Dangerous operations require confirmation:
- Delete files/folders
- Execute commands
- Modify multiple files

### Content Validation
- File size limits enforced
- Content sanitization
- Type checking

---

## Integration Example

```typescript
// src/services/agent-service.ts
import { streamText } from 'ai'
import { allTools } from './tools'

export async function executeAgentTask(message: string) {
  const result = await streamText({
    model: openai('gpt-4'),
    messages: [
      { role: 'system', content: 'You are a helpful project manager' },
      { role: 'user', content: message }
    ],
    tools: allTools,
    maxSteps: 10
  })
  
  return result
}
```

---

## Testing Tools

Each tool has comprehensive tests:

```typescript
describe('read_file tool', () => {
  it('reads existing file', async () => {
    const result = await readFileTool.execute({ path: 'test.md' })
    expect(result.success).toBe(true)
    expect(result.content).toBeDefined()
  })
  
  it('handles missing file', async () => {
    const result = await readFileTool.execute({ path: 'missing.md' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })
})
```

---

## Usage Analytics

Track tool usage to optimize:
- Most used tools
- Success rates
- Average execution time
- Error patterns
- User preferences

This helps prioritize tool improvements and guide feature development.
