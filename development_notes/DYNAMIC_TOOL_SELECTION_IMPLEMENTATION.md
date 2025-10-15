# Dynamic Tool Selection System - Implementation Plan

**Status**: Approved Enhancement  
**Priority**: HIGH  
**Estimated Time**: 4-5 hours (in addition to context tools)  

## Overview

Implement a system where users can **dynamically select which tools each agent has access to** through the UI. This includes both the orchestrator and all subagents.

### User Experience

1. In Agent Management UI, each agent has a "Tools" section
2. Shows list of all available tools with descriptions
3. User checks/unchecks tools they want that agent to have
4. Selected tools are saved with agent configuration
5. Agent only sees and can use selected tools

---

## Architecture Changes

### Current Architecture (Hardcoded)
```typescript
// All agents get all tools
const result = await streamText({
  model,
  messages: [systemMessage, ...messages],
  tools: tools, // ← All tools, always
})
```

### New Architecture (Dynamic)
```typescript
// Each agent gets only their selected tools
const selectedTools = getToolsForAgent(agentConfig)
const result = await streamText({
  model,
  messages: [systemMessage, ...messages],
  tools: selectedTools, // ← Only selected tools
})
```

---

## Implementation Steps

### Step 1: Define Tool Registry ✅

**File**: `src/services/tools/tool-registry.ts`

**Purpose**: Central registry of all available tools with metadata

```typescript
import { CoreTool } from 'ai'
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

export interface ToolDefinition {
  id: string // Unique identifier (e.g., "read_file")
  name: string // Display name (e.g., "Read File")
  description: string // Short description for UI
  category: 'file' | 'context' | 'agent' | 'custom' // Tool category
  tool: CoreTool // The actual tool implementation
  defaultEnabled: boolean // Should this be enabled by default?
}

// Registry of all available tools
export const TOOL_REGISTRY: ToolDefinition[] = [
  // File Management Tools
  {
    id: 'read_file',
    name: 'Read File',
    description: 'Read contents of files in the project',
    category: 'file',
    tool: readFileTool,
    defaultEnabled: true,
  },
  {
    id: 'write_file',
    name: 'Write File',
    description: 'Update existing files in the project',
    category: 'file',
    tool: writeFileTool,
    defaultEnabled: true,
  },
  {
    id: 'create_file',
    name: 'Create File',
    description: 'Create new files in the project',
    category: 'file',
    tool: createFileTool,
    defaultEnabled: true,
  },
  {
    id: 'create_folder',
    name: 'Create Folder',
    description: 'Create new folders/directories',
    category: 'file',
    tool: createFolderTool,
    defaultEnabled: true,
  },
  {
    id: 'list_files',
    name: 'List Files',
    description: 'List files and folders in directories',
    category: 'file',
    tool: listFilesTool,
    defaultEnabled: true,
  },
  
  // Context Management Tools
  {
    id: 'write_context_note',
    name: 'Write Context Note',
    description: 'Save information to agent working memory',
    category: 'context',
    tool: writeContextNoteTool,
    defaultEnabled: false, // Not default, user chooses
  },
  {
    id: 'read_context_note',
    name: 'Read Context Note',
    description: 'Read saved context from previous sessions',
    category: 'context',
    tool: readContextNoteTool,
    defaultEnabled: false,
  },
  {
    id: 'list_context_notes',
    name: 'List Context Notes',
    description: 'See available context notes',
    category: 'context',
    tool: listContextNotesTool,
    defaultEnabled: false,
  },
  {
    id: 'log_progress',
    name: 'Log Progress',
    description: 'Track progress and achievements',
    category: 'context',
    tool: logProgressTool,
    defaultEnabled: false,
  },
]

// Get tool by ID
export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find(tool => tool.id === id)
}

// Get tools by category
export function getToolsByCategory(category: string): ToolDefinition[] {
  return TOOL_REGISTRY.filter(tool => tool.category === category)
}

// Get default enabled tools
export function getDefaultTools(): string[] {
  return TOOL_REGISTRY
    .filter(tool => tool.defaultEnabled)
    .map(tool => tool.id)
}

// Build tool set from IDs
export function buildToolSet(toolIds: string[], includeAgentTools: Record<string, CoreTool> = {}): Record<string, CoreTool> {
  const tools: Record<string, CoreTool> = {}
  
  // Add selected static tools
  toolIds.forEach(id => {
    const toolDef = getToolById(id)
    if (toolDef) {
      tools[id] = toolDef.tool
    }
  })
  
  // Add agent tools (for orchestrator)
  Object.entries(includeAgentTools).forEach(([id, tool]) => {
    tools[id] = tool
  })
  
  return tools
}
```

**Actions**:
- [ ] Create `src/services/tools/tool-registry.ts`
- [ ] Implement all functions above
- [ ] Export from tools index

---

### Step 2: Update Agent Configuration Types ✅

**File**: `src/store/index.ts`

**Add to AgentConfig interface**:

```typescript
export interface AgentConfig {
  id: string
  name: string
  provider: string
  apiKey: string
  model: string
  systemPrompt: string
  description: string
  temperature?: number
  maxTokens?: number
  selectedTools: string[] // NEW: Array of tool IDs this agent can use
}
```

**Update default configurations**:

```typescript
// In updateOrchestrator function
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
          selectedTools: getDefaultTools(), // NEW: Default tools
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

// In createSubAgent function
createSubAgent: async (config) => {
  const id = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const newAgent: AgentConfig = {
    id,
    selectedTools: getDefaultTools(), // NEW: Default tools
    ...config,
  }
  
  // ... rest of implementation
}
```

**Actions**:
- [ ] Add `selectedTools` to AgentConfig interface
- [ ] Update `updateOrchestrator` default
- [ ] Update `createSubAgent` default
- [ ] Update `updateSubAgent` to handle selectedTools

---

### Step 3: Update Agent Service ✅

**File**: `src/services/agent-service.ts`

**Modify**: `executeWithStreaming` to use selected tools

```typescript
async executeWithStreaming(
  config: AgentConfig,
  messages: CoreMessage[],
  subAgents: AgentConfig[] = [],
  maxSteps: number = 20
) {
  if (!config.provider || !config.model) {
    throw new Error('Agent not configured. Please configure provider and model in Agent Management.')
  }

  if (!config.apiKey) {
    throw new Error(`API key is required. Please add your ${config.provider} API key in Agent Management.`)
  }

  const model = this.getModel(config)
  
  // Use hardcoded orchestrator prompt if this is the orchestrator agent
  const isOrchestrator = config.id === 'orchestrator' || config.name === 'Orchestrator'
  const systemPrompt = isOrchestrator ? ORCHESTRATOR_SYSTEM_PROMPT : (config.systemPrompt || 'You are a helpful assistant.')
  
  const systemMessage: CoreMessage = {
    role: 'system',
    content: systemPrompt
  }
  
  // Generate tools from subagents if this is the orchestrator
  const agentTools = isOrchestrator && subAgents.length > 0 
    ? generateToolsFromAgents(subAgents)
    : {}
  
  // NEW: Build tool set from selected tool IDs
  const selectedToolIds = config.selectedTools || getDefaultTools()
  const selectedTools = buildToolSet(selectedToolIds, agentTools)
  
  try {
    const result = await streamText({
      model,
      messages: [systemMessage, ...messages],
      tools: selectedTools, // Use selected tools instead of all tools
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      stopWhen: stepCountIs(maxSteps),
      onStepFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
        console.log('Step finished:', {
          textLength: text?.length || 0,
          toolCallsCount: toolCalls?.length || 0,
          toolResultsCount: toolResults?.length || 0,
          finishReason,
          usage
        })
      },
    })
    
    return result
  } catch (error) {
    console.error('Agent execution error:', error)
    throw error
  }
}
```

**Also update**: `executeWithoutStreaming` with same logic

**Actions**:
- [ ] Import `buildToolSet` and `getDefaultTools` from tool-registry
- [ ] Modify `executeWithStreaming` to use selected tools
- [ ] Modify `executeWithoutStreaming` to use selected tools
- [ ] Test with different tool selections

---

### Step 4: Create Tool Selection UI Component ✅

**File**: `src/components/AgentManagement/ToolSelector.tsx`

```typescript
import React from 'react'
import { TOOL_REGISTRY } from '@/services/tools/tool-registry'

interface ToolSelectorProps {
  selectedTools: string[]
  onChange: (selectedTools: string[]) => void
}

export function ToolSelector({ selectedTools, onChange }: ToolSelectorProps) {
  // Group tools by category
  const categories = {
    file: TOOL_REGISTRY.filter(t => t.category === 'file'),
    context: TOOL_REGISTRY.filter(t => t.category === 'context'),
    agent: TOOL_REGISTRY.filter(t => t.category === 'agent'),
    custom: TOOL_REGISTRY.filter(t => t.category === 'custom'),
  }

  const handleToggleTool = (toolId: string) => {
    const newSelection = selectedTools.includes(toolId)
      ? selectedTools.filter(id => id !== toolId)
      : [...selectedTools, toolId]
    onChange(newSelection)
  }

  const handleSelectAll = (categoryTools: typeof TOOL_REGISTRY) => {
    const categoryIds = categoryTools.map(t => t.id)
    const allSelected = categoryIds.every(id => selectedTools.includes(id))
    
    if (allSelected) {
      // Deselect all in category
      onChange(selectedTools.filter(id => !categoryIds.includes(id)))
    } else {
      // Select all in category
      const newSelection = [...new Set([...selectedTools, ...categoryIds])]
      onChange(newSelection)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-200">Available Tools</h3>
        <span className="text-xs text-gray-400">
          {selectedTools.length} / {TOOL_REGISTRY.length} selected
        </span>
      </div>

      {/* File Management Tools */}
      {categories.file.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-300">File Management</h4>
            <button
              onClick={() => handleSelectAll(categories.file)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {categories.file.every(t => selectedTools.includes(t.id)) ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-1">
            {categories.file.map(tool => (
              <label
                key={tool.id}
                className="flex items-start space-x-2 p-2 rounded hover:bg-gray-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTools.includes(tool.id)}
                  onChange={() => handleToggleTool(tool.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm text-gray-200">{tool.name}</div>
                  <div className="text-xs text-gray-400">{tool.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Context Management Tools */}
      {categories.context.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-300">Context Management</h4>
            <button
              onClick={() => handleSelectAll(categories.context)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {categories.context.every(t => selectedTools.includes(t.id)) ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-1">
            {categories.context.map(tool => (
              <label
                key={tool.id}
                className="flex items-start space-x-2 p-2 rounded hover:bg-gray-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTools.includes(tool.id)}
                  onChange={() => handleToggleTool(tool.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm text-gray-200">{tool.name}</div>
                  <div className="text-xs text-gray-400">{tool.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Agent Tools */}
      {categories.agent.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-300">Agent Tools</h4>
            <button
              onClick={() => handleSelectAll(categories.agent)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {categories.agent.every(t => selectedTools.includes(t.id)) ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-1">
            {categories.agent.map(tool => (
              <label
                key={tool.id}
                className="flex items-start space-x-2 p-2 rounded hover:bg-gray-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTools.includes(tool.id)}
                  onChange={() => handleToggleTool(tool.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm text-gray-200">{tool.name}</div>
                  <div className="text-xs text-gray-400">{tool.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          Selected tools will be available to this agent. The agent will see tool descriptions and can use them when appropriate.
        </p>
      </div>
    </div>
  )
}
```

**Actions**:
- [ ] Create `src/components/AgentManagement/ToolSelector.tsx`
- [ ] Implement component with checkbox UI
- [ ] Add category grouping
- [ ] Add select all/deselect all per category
- [ ] Style with Tailwind

---

### Step 5: Integrate Tool Selector in Agent UI ✅

**File**: `src/components/AgentManagement/index.tsx`

**Add ToolSelector to orchestrator configuration**:

```typescript
import { ToolSelector } from './ToolSelector'

// In the orchestrator form section, after system prompt field:
<div>
  <label className="block text-sm font-medium text-gray-200 mb-2">
    Available Tools
  </label>
  <ToolSelector
    selectedTools={orchestrator.selectedTools || getDefaultTools()}
    onChange={(selectedTools) => {
      updateOrchestrator({ selectedTools })
    }}
  />
</div>
```

**File**: `src/components/AgentManagement/CreateAgentDialog.tsx`

**Add ToolSelector to subagent creation form**:

```typescript
import { ToolSelector } from './ToolSelector'
import { getDefaultTools } from '@/services/tools/tool-registry'

// Add to form state
const [selectedTools, setSelectedTools] = useState<string[]>(getDefaultTools())

// Add to form UI, before the create button:
<div>
  <label className="block text-sm font-medium text-gray-200 mb-2">
    Available Tools
  </label>
  <ToolSelector
    selectedTools={selectedTools}
    onChange={setSelectedTools}
  />
</div>

// Update handleSubmit to include selectedTools:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  await createSubAgent({
    name,
    provider,
    apiKey,
    model,
    systemPrompt,
    description,
    temperature,
    maxTokens,
    selectedTools, // NEW: Include selected tools
  })
  
  // Reset and close
  handleClose()
}
```

**Actions**:
- [ ] Add ToolSelector to orchestrator UI
- [ ] Add ToolSelector to CreateAgentDialog
- [ ] Add selectedTools to form state
- [ ] Update submit handlers
- [ ] Test UI functionality

---

### Step 6: Update Orchestrator Prompt ✅

**File**: `src/services/orchestrator-prompt.ts`

**Modify intro to be dynamic**:

```typescript
export const ORCHESTRATOR_SYSTEM_PROMPT = `# ROLE AND IDENTITY

You are the **Orchestrator Agent**, an advanced AI project management assistant designed to help users organize, manage, and maintain their projects efficiently. You are the primary interface between the user and their project files, with the authority and capability to perform file operations autonomously.

## YOUR RESPONSIBILITIES

1. **Understand User Intent**: Carefully analyze user requests to determine the exact actions needed
2. **Execute Tasks Autonomously**: Use available tools to complete tasks without unnecessary confirmation
3. **Manage Project Structure**: Help organize files and folders logically
4. **Provide Clear Feedback**: Explain what you're doing and confirm completed actions
5. **Handle Errors Gracefully**: If something fails, explain why and suggest alternatives

---

# AVAILABLE TOOLS

You have access to the tools selected for you by the user. Each tool serves a specific purpose. Use them intelligently to assist users with their projects.

**Important**: Only use the tools that are available to you. If a tool is not available, explain that to the user and suggest an alternative approach if possible.
`

// Then document each tool, but note that not all may be available
```

**Note**: The prompt should be more generic since different agents will have different tools. Consider generating dynamic prompt sections based on selected tools (future enhancement).

**Actions**:
- [ ] Update prompt to be tool-agnostic
- [ ] Add note about selected tools
- [ ] Consider dynamic prompt generation (Phase 2)

---

### Step 7: Update Tool Exports ✅

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

// Export tool registry
export * from './tool-registry'

// Legacy export for backwards compatibility
// (Will be replaced by dynamic tool selection)
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
```

**Actions**:
- [ ] Export tool-registry functions
- [ ] Keep legacy export for transition
- [ ] Update imports across codebase

---

## User Experience Flow

### Orchestrator Configuration

1. User opens Agent Management
2. Clicks on Orchestrator tab
3. Scrolls to "Available Tools" section
4. Sees tools grouped by category:
   - **File Management** (5 tools) - All checked by default
   - **Context Management** (4 tools) - Unchecked by default
5. User checks "Write Context Note" and "Read Context Note"
6. Changes save automatically
7. Orchestrator now has access to those tools

### Subagent Configuration

1. User clicks "Create Agent"
2. Fills in name, description, etc.
3. Scrolls to "Available Tools" section
4. Sees same tool list
5. User selects only "Read File" and "Write File"
6. Creates agent
7. Subagent only has access to those 2 tools

### In Use

```
User: "Analyze the codebase and save your findings"

Orchestrator (with context tools):
- Uses read_file to analyze code
- Uses write_context_note to save findings ✅

Subagent (without context tools):
- Uses read_file to analyze code
- Cannot save findings (tool not available)
- Returns analysis directly to orchestrator ✅
```

---

## Benefits of Dynamic Tool Selection

### 1. Flexibility
- Each agent can have different capabilities
- Orchestrator can have context tools
- Code analysis agent only needs file reading
- Writing agent only needs file writing

### 2. Security
- Limit agent capabilities based on role
- Research agent can't modify files
- Execution agent can't access sensitive tools

### 3. Performance
- Smaller tool set = less tokens in prompt
- Faster LLM decision making
- Reduced API costs

### 4. User Control
- Users decide what each agent can do
- Clear visibility into agent capabilities
- Easy to adjust permissions

### 5. Scalability
- Easy to add new tools
- Tools automatically appear in UI
- No code changes needed for new tools

---

## File Structure

```
src/
├── services/
│   ├── tools/
│   │   ├── file-tools.ts        # File management tools
│   │   ├── context-tools.ts     # Context management tools
│   │   ├── tool-registry.ts     # NEW: Tool registry
│   │   └── index.ts             # Updated exports
│   ├── agent-service.ts         # Modified: Dynamic tool building
│   └── context-manager.ts       # Context management service
├── components/
│   └── AgentManagement/
│       ├── ToolSelector.tsx     # NEW: Tool selection UI
│       ├── index.tsx            # Modified: Add tool selector
│       └── CreateAgentDialog.tsx # Modified: Add tool selector
└── store/
    └── index.ts                 # Modified: Add selectedTools field
```

---

## Implementation Checklist

### Phase 1: Core System (3-4 hours)
- [ ] Create tool-registry.ts
- [ ] Update AgentConfig type with selectedTools
- [ ] Update agent-service.ts to use dynamic tools
- [ ] Update store actions to handle selectedTools
- [ ] Test with manual tool selection

### Phase 2: UI Components (2-3 hours)
- [ ] Create ToolSelector component
- [ ] Add to orchestrator UI
- [ ] Add to CreateAgentDialog
- [ ] Add to edit agent UI (if exists)
- [ ] Test UI interactions

### Phase 3: Polish & Testing (1-2 hours)
- [ ] Update orchestrator prompt
- [ ] Test various tool combinations
- [ ] Verify persistence works
- [ ] Test import/export
- [ ] Document new feature

**Total Time**: 6-9 hours

---

## Testing Scenarios

### Test 1: Orchestrator with Context Tools
```
Setup:
- Enable all file tools
- Enable write_context_note, read_context_note

Test:
User: "Analyze the project and save what you learn"

Expected:
- Orchestrator uses read_file ✅
- Orchestrator uses write_context_note ✅
- Context saved in .agent/ folder ✅
```

### Test 2: Subagent without Write Tools
```
Setup:
- Enable only read_file for subagent
- Disable all write tools

Test:
Orchestrator delegates to subagent: "Read and analyze config.json"

Expected:
- Subagent uses read_file ✅
- Subagent cannot modify files ✅
- Subagent returns analysis ✅
```

### Test 3: Tool Selection Persistence
```
Setup:
- Configure orchestrator with custom tool selection
- Close and reopen app

Test:
- Check orchestrator configuration

Expected:
- Tool selection persists ✅
- Matches what was selected ✅
```

### Test 4: Dynamic Tool Updates
```
Setup:
- Orchestrator has all tools
- Mid-session, user removes write_file

Test:
User: "Update README.md"

Expected:
- Orchestrator sees write_file is not available
- Explains tool is not available
- Suggests alternative ✅
```

---

## Migration Strategy

### For Existing Agents

When loading existing agents without `selectedTools`:

```typescript
// In store initialization
loadAgentSettings: async () => {
  try {
    const settings = await settingsPersistence.loadSettings()
    
    // Migrate agents without selectedTools
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
}
```

**Default Behavior**: All file tools enabled, context tools disabled

---

## Future Enhancements

### Phase 2 (Later)
1. **Tool Templates** - "Research Agent", "Code Writer", etc.
2. **Tool Recommendations** - AI suggests tools based on agent description
3. **Tool Usage Analytics** - Track which tools are used most
4. **Custom Tool Upload** - Users can add their own tools
5. **Tool Dependencies** - "write_context_note requires read_context_note"
6. **Dynamic Prompts** - Generate prompt based on available tools

---

## Success Metrics

✅ **Implementation Complete When**:
1. Tool registry created and populated
2. UI allows tool selection per agent
3. Agents only receive selected tools
4. Tool selection persists correctly
5. No errors with various tool combinations
6. Documentation updated

---

## Conclusion

This enhancement makes the system significantly more flexible while maintaining simplicity. Users get fine-grained control over agent capabilities without breaking existing functionality.

**Next**: Implement tool registry, then UI components, then integrate and test.
