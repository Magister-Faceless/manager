# Context Management Tools - Implementation Plan

**Status**: Ready to Implement  
**Priority**: HIGH  
**Estimated Time**: 2-3 hours  

## Phase 1: Core Context Management

### Overview

Implement a `.agent/` folder system with context management tools that enable the orchestrator to:
1. Maintain memory across sessions
2. Track progress on complex tasks
3. Store research findings
4. Plan and execute multi-step projects

---

## Implementation Checklist

### Step 1: Create Type Definitions ✅

**File**: `src/types/context.ts`

```typescript
export type ContextCategory = 'architecture' | 'progress' | 'research' | 'tasks' | 'notes'

export interface ContextNote {
  category: ContextCategory
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface ContextMetadata {
  projectName: string
  lastUpdated: string
  categories: Record<ContextCategory, string[]> // category -> list of note titles
}
```

**Actions**:
- [ ] Create `src/types/context.ts`
- [ ] Define types above
- [ ] Export from `src/types/index.ts` (if exists)

---

### Step 2: Create Context Manager Service ✅

**File**: `src/services/context-manager.ts`

**Responsibilities**:
- Initialize `.agent/` folder structure
- Read/write context notes
- Manage metadata
- Handle file operations

```typescript
import { fileSystemService } from './file-system'

export class ContextManager {
  private rootHandle: FileSystemDirectoryHandle | null = null
  private agentFolderHandle: FileSystemDirectoryHandle | null = null

  // Set the project root handle
  setRootHandle(handle: FileSystemDirectoryHandle) {
    this.rootHandle = handle
  }

  // Initialize .agent/ folder
  async initializeAgentFolder(): Promise<void> {
    if (!this.rootHandle) throw new Error('Root handle not set')
    
    // Create .agent/ folder if it doesn't exist
    this.agentFolderHandle = await this.rootHandle.getDirectoryHandle('.agent', {
      create: true
    })
    
    // Create README.md explaining the folder
    await this.createReadmeIfNotExists()
    
    // Create default structure
    await this.agentFolderHandle.getDirectoryHandle('research', { create: true })
    await this.agentFolderHandle.getDirectoryHandle('sessions', { create: true })
  }

  // Create README in .agent/ folder
  private async createReadmeIfNotExists(): Promise<void> {
    if (!this.agentFolderHandle) return
    
    try {
      await this.agentFolderHandle.getFileHandle('README.md')
    } catch {
      // File doesn't exist, create it
      const readme = `# Agent Working Directory

This folder is used by the AI orchestrator agent to maintain context and memory across sessions.

## Contents

- **context.md** - Project understanding and architectural notes
- **progress.md** - Session-by-session progress tracking
- **tasks.json** - Current task list and planning
- **research/** - Research findings and analysis
- **sessions/** - Individual session logs

## Purpose

The orchestrator uses this folder to:
1. Remember what it learned about your project
2. Track progress on multi-step tasks
3. Maintain context between sessions
4. Store research and findings

You can review these files to see what the agent is "thinking" and "remembering".

## Do Not Edit Manually

These files are managed by the agent. Manual edits may confuse the agent's understanding.
`
      const fileHandle = await this.agentFolderHandle.getFileHandle('README.md', {
        create: true
      })
      await fileSystemService.writeFile(fileHandle, readme)
    }
  }

  // Write a context note
  async writeContextNote(
    category: ContextCategory,
    title: string,
    content: string,
    append: boolean = false
  ): Promise<void> {
    if (!this.agentFolderHandle) {
      throw new Error('Agent folder not initialized')
    }

    const fileName = `${category}.md`
    
    try {
      const fileHandle = await this.agentFolderHandle.getFileHandle(fileName, {
        create: true
      })

      let finalContent = content
      
      if (append) {
        // Read existing content and append
        const existingContent = await fileSystemService.readFile(fileHandle)
        finalContent = existingContent + '\n\n---\n\n' + content
      }

      // Add metadata header
      const timestamp = new Date().toISOString()
      const fullContent = `# ${title}\n\n**Updated**: ${timestamp}\n\n${finalContent}`

      await fileSystemService.writeFile(fileHandle, fullContent)
    } catch (error) {
      console.error('Error writing context note:', error)
      throw error
    }
  }

  // Read a context note
  async readContextNote(category: ContextCategory): Promise<string | null> {
    if (!this.agentFolderHandle) {
      throw new Error('Agent folder not initialized')
    }

    const fileName = `${category}.md`
    
    try {
      const fileHandle = await this.agentFolderHandle.getFileHandle(fileName)
      const content = await fileSystemService.readFile(fileHandle)
      return content
    } catch {
      // File doesn't exist
      return null
    }
  }

  // List all context notes
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

  // Log progress for current session
  async logProgress(summary: string, details?: {
    achievements?: string[]
    nextSteps?: string[]
    blockers?: string[]
  }): Promise<void> {
    if (!this.agentFolderHandle) {
      throw new Error('Agent folder not initialized')
    }

    const timestamp = new Date().toISOString()
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    let progressEntry = `## ${date}\n\n${summary}\n`

    if (details?.achievements && details.achievements.length > 0) {
      progressEntry += '\n**Achievements:**\n'
      details.achievements.forEach(a => {
        progressEntry += `- ✅ ${a}\n`
      })
    }

    if (details?.nextSteps && details.nextSteps.length > 0) {
      progressEntry += '\n**Next Steps:**\n'
      details.nextSteps.forEach(n => {
        progressEntry += `- 🔜 ${n}\n`
      })
    }

    if (details?.blockers && details.blockers.length > 0) {
      progressEntry += '\n**Blockers:**\n'
      details.blockers.forEach(b => {
        progressEntry += `- ⚠️ ${b}\n`
      })
    }

    progressEntry += '\n---\n'

    // Append to progress.md
    await this.writeContextNote('progress', 'Progress Log', progressEntry, true)
  }
}

export const contextManager = new ContextManager()
```

**Actions**:
- [ ] Create `src/services/context-manager.ts`
- [ ] Implement all methods above
- [ ] Test folder creation
- [ ] Test read/write operations

---

### Step 3: Create Context Tools ✅

**File**: `src/services/tools/context-tools.ts`

```typescript
import { tool } from 'ai'
import { z } from 'zod'
import { contextManager } from '@/services/context-manager'

// Tool 1: Write Context Note
export const writeContextNoteTool = tool({
  description: `Save important information to the agent's working memory for future sessions. Use this to remember key findings, decisions, or project understanding. The note is saved in the .agent/ folder and persists across sessions.

Categories:
- architecture: Project structure, tech stack, design patterns
- progress: What's been accomplished, current status
- research: Analysis findings, documentation notes
- tasks: Task planning and tracking
- notes: General notes and observations

Use this whenever you learn something important that should be remembered.`,
  
  inputSchema: z.object({
    category: z.enum(['architecture', 'progress', 'research', 'tasks', 'notes'])
      .describe('Category of the note'),
    title: z.string()
      .describe('Brief title for the note'),
    content: z.string()
      .describe('The note content (can use Markdown formatting)'),
    append: z.boolean()
      .optional()
      .default(false)
      .describe('If true, append to existing note; if false, replace')
  }),
  
  execute: async ({ category, title, content, append }) => {
    try {
      await contextManager.writeContextNote(category, title, content, append)
      
      return {
        success: true,
        message: `Context note saved to ${category}.md`,
        category,
        title,
        append
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error saving context note'
      }
    }
  }
})

// Tool 2: Read Context Note
export const readContextNoteTool = tool({
  description: `Read previously saved context notes from the agent's working memory. Use this at the start of a session to recall what you learned before, or when you need to reference past decisions. Returns the full content of the note in the specified category.`,
  
  inputSchema: z.object({
    category: z.enum(['architecture', 'progress', 'research', 'tasks', 'notes'])
      .describe('Category of the note to read')
  }),
  
  execute: async ({ category }) => {
    try {
      const content = await contextManager.readContextNote(category)
      
      if (!content) {
        return {
          success: true,
          found: false,
          message: `No ${category} note found. This category hasn't been used yet.`,
          category
        }
      }
      
      return {
        success: true,
        found: true,
        category,
        content,
        lines: content.split('\n').length,
        size: content.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error reading context note'
      }
    }
  }
})

// Tool 3: List Context Notes
export const listContextNotesTool = tool({
  description: `List all available context notes to see what has been saved in the agent's working memory. Use this to get an overview of what information is available from previous sessions.`,
  
  inputSchema: z.object({}),
  
  execute: async () => {
    try {
      const notes = await contextManager.listContextNotes()
      
      const available = Object.entries(notes)
        .filter(([_, exists]) => exists)
        .map(([category]) => category)
      
      const notAvailable = Object.entries(notes)
        .filter(([_, exists]) => !exists)
        .map(([category]) => category)
      
      return {
        success: true,
        notes,
        available,
        notAvailable,
        totalAvailable: available.length,
        message: available.length > 0 
          ? `Found ${available.length} context note(s): ${available.join(', ')}`
          : 'No context notes found yet'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error listing context notes'
      }
    }
  }
})

// Tool 4: Log Progress
export const logProgressTool = tool({
  description: `Log progress for the current work session. Use this to record what was accomplished, what's next, and any blockers. This helps maintain continuity across sessions and provides a timeline of work done.`,
  
  inputSchema: z.object({
    summary: z.string()
      .describe('Brief summary of current progress'),
    achievements: z.array(z.string())
      .optional()
      .describe('List of things accomplished in this session'),
    nextSteps: z.array(z.string())
      .optional()
      .describe('List of next steps to take'),
    blockers: z.array(z.string())
      .optional()
      .describe('List of blockers or issues encountered')
  }),
  
  execute: async ({ summary, achievements, nextSteps, blockers }) => {
    try {
      await contextManager.logProgress(summary, {
        achievements,
        nextSteps,
        blockers
      })
      
      return {
        success: true,
        message: 'Progress logged successfully',
        summary,
        itemsLogged: {
          achievements: achievements?.length || 0,
          nextSteps: nextSteps?.length || 0,
          blockers: blockers?.length || 0
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error logging progress'
      }
    }
  }
})
```

**Actions**:
- [ ] Create `src/services/tools/context-tools.ts`
- [ ] Implement all 4 tools above
- [ ] Test each tool individually

---

### Step 4: Export Tools ✅

**File**: `src/services/tools/index.ts`

```typescript
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

export const tools = {
  // File management tools
  read_file: readFileTool,
  write_file: writeFileTool,
  create_file: createFileTool,
  create_folder: createFolderTool,
  list_files: listFilesTool,
  
  // Context management tools
  write_context_note: writeContextNoteTool,
  read_context_note: readContextNoteTool,
  list_context_notes: listContextNotesTool,
  log_progress: logProgressTool,
}

export default tools
```

**Actions**:
- [ ] Update `src/services/tools/index.ts`
- [ ] Export context tools
- [ ] Verify tools are available

---

### Step 5: Initialize Context Manager on Project Load ✅

**File**: `src/store/index.ts`

**Modify**: `selectProject` and `addProject` functions

```typescript
// In addProject function, after setting root handle:
if (newProject.directoryHandle) {
  fileSystemService.setRootHandle(newProject.directoryHandle)
  chatPersistence.setRootHandle(newProject.directoryHandle)
  contextManager.setRootHandle(newProject.directoryHandle) // ADD THIS
  
  // Initialize agent folder
  contextManager.initializeAgentFolder().catch(error => {
    console.error('Failed to initialize agent folder:', error)
  })
  
  get().loadProjectFiles()
  get().loadChatThreads()
}

// In selectProject function, after setting root handle:
if (project.directoryHandle) {
  fileSystemService.setRootHandle(project.directoryHandle)
  chatPersistence.setRootHandle(project.directoryHandle)
  contextManager.setRootHandle(project.directoryHandle) // ADD THIS
  
  // Initialize agent folder
  await contextManager.initializeAgentFolder().catch(error => {
    console.error('Failed to initialize agent folder:', error)
  })
  
  await get().loadProjectFiles()
  await get().loadChatThreads()
}
```

**Actions**:
- [ ] Modify `addProject` function
- [ ] Modify `selectProject` function
- [ ] Test project loading
- [ ] Verify `.agent/` folder is created

---

### Step 6: Update Orchestrator Prompt ✅

**File**: `src/services/orchestrator-prompt.ts`

**Add new section** after TOOL 5 (list_files) and before OPERATIONAL GUIDELINES:

```typescript
---

## TOOL 6: write_context_note

**Purpose**: Save important information to your working memory that persists across sessions.

**When to Use**:
- When you learn something important about the project
- After completing significant analysis
- To remember decisions or findings
- For information needed in future sessions
- When building up project understanding over time

**Input Parameters**:
- \`category\` (enum, required): Type of note
  - "architecture" - Tech stack, structure, design patterns
  - "progress" - Status updates, what's been done
  - "research" - Analysis findings, documentation
  - "tasks" - Task planning and tracking
  - "notes" - General observations
- \`title\` (string, required): Brief descriptive title
- \`content\` (string, required): The note content (Markdown supported)
- \`append\` (boolean, optional): true = add to existing, false = replace (default: false)

**Output**:
- \`success\` (boolean): Whether the operation succeeded
- \`message\` (string): Confirmation message
- \`category\` (string): The category used
- \`error\` (string): Error message if failed

**Example Usage Scenarios**:

1. **After analyzing code structure**:
   \`\`\`
   write_context_note({
     category: "architecture",
     title: "Tech Stack Analysis",
     content: "Project uses React 18 + Vite + Zustand for state management. Component structure follows atomic design pattern."
   })
   \`\`\`

2. **Recording progress**:
   \`\`\`
   write_context_note({
     category: "progress",
     title: "API Integration Status",
     content: "Completed payment API integration. Next: testing phase.",
     append: true
   })
   \`\`\`

3. **Saving research findings**:
   \`\`\`
   write_context_note({
     category: "research",
     title: "Performance Analysis",
     content: "Found 3 components causing re-renders. Details: ..."
   })
   \`\`\`

**Important Notes**:
- Notes are saved in \`.agent/\` folder
- They persist across sessions
- Use at the START of complex tasks to save findings
- Use DURING tasks to checkpoint progress
- Use at the END to summarize what was learned

---

## TOOL 7: read_context_note

**Purpose**: Read previously saved context notes from your working memory.

**When to Use**:
- At the start of a new session
- Before continuing a multi-session task
- When you need to recall past decisions
- To review what you learned before

**Input Parameters**:
- \`category\` (enum, required): Category to read from
  - "architecture", "progress", "research", "tasks", or "notes"

**Output**:
- \`success\` (boolean): Whether the operation succeeded
- \`found\` (boolean): Whether a note exists in this category
- \`content\` (string): The full note content (if found)
- \`lines\` (number): Number of lines in the note
- \`size\` (number): Size in characters

**Example Usage Scenarios**:

1. **Starting a new session**:
   \`\`\`
   // First, check what notes exist
   list_context_notes()
   
   // Then read relevant notes
   read_context_note({ category: "progress" })
   read_context_note({ category: "architecture" })
   \`\`\`

2. **Continuing previous work**:
   \`\`\`
   read_context_note({ category: "tasks" })
   // Returns: "Working on API integration. Completed auth, next: payments"
   \`\`\`

**Best Practice**: Always read context notes at the START of a session to maintain continuity.

---

## TOOL 8: list_context_notes

**Purpose**: See which context notes are available in your working memory.

**When to Use**:
- At the start of any session
- To get an overview of saved information
- Before deciding what to read

**Input Parameters**: None

**Output**:
- \`success\` (boolean): Whether the operation succeeded
- \`notes\` (object): Map of category -> exists (boolean)
- \`available\` (array): List of categories with notes
- \`totalAvailable\` (number): Count of available notes

**Example Usage**:
\`\`\`
list_context_notes()
// Returns: { available: ["architecture", "progress"], totalAvailable: 2 }
\`\`\`

**Best Practice**: Call this FIRST at the start of each session.

---

## TOOL 9: log_progress

**Purpose**: Log what you accomplished in the current session with structured tracking.

**When to Use**:
- After completing significant work
- At the end of a work session
- When reaching a milestone
- Before switching to a different task

**Input Parameters**:
- \`summary\` (string, required): Brief overview of progress
- \`achievements\` (array of strings, optional): What was completed
- \`nextSteps\` (array of strings, optional): What to do next
- \`blockers\` (array of strings, optional): Issues encountered

**Output**:
- \`success\` (boolean): Whether the operation succeeded
- \`message\` (string): Confirmation message
- \`itemsLogged\` (object): Count of achievements, nextSteps, blockers

**Example Usage Scenarios**:

1. **After completing work**:
   \`\`\`
   log_progress({
     summary: "Completed API integration phase",
     achievements: [
       "Integrated payment gateway",
       "Added error handling",
       "Wrote unit tests"
     ],
     nextSteps: [
       "Run integration tests",
       "Deploy to staging"
     ],
     blockers: []
   })
   \`\`\`

2. **With blockers**:
   \`\`\`
   log_progress({
     summary: "Partial completion - waiting on dependencies",
     achievements: ["Completed UI mockups"],
     nextSteps: ["Implement API calls once endpoint is ready"],
     blockers: ["Waiting for backend team to deploy API"]
   })
   \`\`\`

**Important**: Progress logs append to progress.md, creating a timeline of work.

---
```

**Actions**:
- [ ] Add new tools section to orchestrator prompt
- [ ] Update tool count in header (9 tools instead of 5)
- [ ] Add guidance in OPERATIONAL GUIDELINES

**Also add to OPERATIONAL GUIDELINES section**:

```typescript
## 10. Context Management Strategy

**For multi-session or complex tasks**:

1. **Start of Session**:
   - Call \`list_context_notes()\` to see what's available
   - Read relevant notes with \`read_context_note()\`
   - Review past progress to maintain continuity

2. **During Work**:
   - Save important findings as you discover them
   - Don't wait until the end
   - Use appropriate categories

3. **End of Session**:
   - Log progress with \`log_progress()\`
   - Save final notes with \`write_context_note()\`
   - Document what's next

**Example Flow**:
\`\`\`
User: "Continue building the dashboard"

1. list_context_notes()
2. read_context_note({ category: "progress" })
3. read_context_note({ category: "architecture" })
4. [Continue work based on context]
5. log_progress({ summary: "Added charts component", ... })
\`\`\`
```

**Actions**:
- [ ] Add context management strategy
- [ ] Include example flows
- [ ] Update related guidelines

---

### Step 7: Testing ✅

**Manual Tests**:

1. **Test 1: Folder Initialization**
   ```
   1. Open project in app
   2. Check that .agent/ folder was created
   3. Verify README.md exists
   4. Verify research/ and sessions/ folders exist
   ```

2. **Test 2: Write Context Note**
   ```
   User: "Analyze the project structure and save what you find"
   
   Expected: Orchestrator uses write_context_note to save findings
   
   Verify:
   - .agent/architecture.md created
   - Contains project analysis
   - Has timestamp and title
   ```

3. **Test 3: Read Context Note**
   ```
   User: "What did you learn about the architecture?"
   
   Expected: Orchestrator uses read_context_note
   
   Verify:
   - Returns previously saved content
   - Orchestrator references the findings
   ```

4. **Test 4: Multi-Session Continuity**
   ```
   Session 1:
   User: "Start analyzing the codebase"
   - Orchestrator saves findings to context notes
   
   [Close and reopen app]
   
   Session 2:
   User: "Continue the analysis"
   - Orchestrator reads context notes
   - Continues from where it left off
   - Doesn't repeat previous work
   ```

5. **Test 5: Progress Logging**
   ```
   User: "Log what we've accomplished today"
   
   Expected: Orchestrator uses log_progress
   
   Verify:
   - .agent/progress.md updated
   - Contains achievements, next steps
   - Has timestamp
   ```

**Actions**:
- [ ] Run all 5 tests
- [ ] Document any issues
- [ ] Fix bugs
- [ ] Verify all features work

---

## File Checklist

### New Files to Create:
- [ ] `src/types/context.ts` - Type definitions
- [ ] `src/services/context-manager.ts` - Context management service
- [ ] `src/services/tools/context-tools.ts` - Context management tools

### Files to Modify:
- [ ] `src/services/tools/index.ts` - Export new tools
- [ ] `src/store/index.ts` - Initialize context manager
- [ ] `src/services/orchestrator-prompt.ts` - Add tool documentation

### Files Created Automatically:
- `.agent/README.md` - Auto-created on first project load
- `.agent/architecture.md` - Created when first used
- `.agent/progress.md` - Created when first used
- `.agent/research.md` - Created when first used
- `.agent/tasks.md` - Created when first used
- `.agent/notes.md` - Created when first used

---

## Success Criteria

✅ **Phase 1 Complete When**:

1. `.agent/` folder auto-creates on project load
2. All 4 context tools work correctly
3. Orchestrator can save and retrieve context
4. Multi-session continuity works
5. Progress logging functions properly
6. No errors in console
7. All manual tests pass

---

## Estimated Timeline

- **Step 1** (Types): 15 minutes
- **Step 2** (Context Manager): 45 minutes
- **Step 3** (Tools): 30 minutes
- **Step 4** (Export): 5 minutes
- **Step 5** (Initialize): 15 minutes
- **Step 6** (Prompt): 30 minutes
- **Step 7** (Testing): 30 minutes

**Total**: ~3 hours

---

## Next Phase Preview

**Phase 2** will add:
- Task management tool (enhanced todos)
- Session summaries
- Automatic context cleanup
- UI for viewing agent context

---

## Questions?

Before implementing, confirm:
- [ ] Is this approach approved?
- [ ] Any concerns about .agent/ folder pattern?
- [ ] Should we add any additional context categories?
- [ ] Any changes to tool names or behavior?

**Ready to proceed with implementation?**
