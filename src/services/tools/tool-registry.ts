/**
 * Tool Registry
 * 
 * Central registry of all available tools with metadata.
 * Used for dynamic tool selection in agent configuration.
 */

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

export type ToolCategory = 'file' | 'context' | 'agent' | 'custom'

// Type for AI SDK tools (tool() return type)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AITool = any

export interface ToolDefinition {
  id: string // Unique identifier (e.g., "read_file")
  name: string // Display name (e.g., "Read File")
  description: string // Short description for UI
  category: ToolCategory // Tool category
  tool: AITool // The actual tool implementation
  defaultEnabled: boolean // Should this be enabled by default?
}

/**
 * Registry of all available tools
 * This is the single source of truth for all tools in the system
 */
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

/**
 * Get tool definition by ID
 * @param id - Tool ID to look up
 * @returns Tool definition or undefined if not found
 */
export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find(tool => tool.id === id)
}

/**
 * Get all tools in a specific category
 * @param category - Category to filter by
 * @returns Array of tool definitions in that category
 */
export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return TOOL_REGISTRY.filter(tool => tool.category === category)
}

/**
 * Get default enabled tool IDs
 * @returns Array of tool IDs that should be enabled by default
 */
export function getDefaultTools(): string[] {
  return TOOL_REGISTRY
    .filter(tool => tool.defaultEnabled)
    .map(tool => tool.id)
}

/**
 * Build a tool set from selected tool IDs
 * @param toolIds - Array of tool IDs to include
 * @param includeAgentTools - Optional agent tools to include (for orchestrator)
 * @returns Object mapping tool IDs to tool implementations
 */
export function buildToolSet(
  toolIds: string[],
  includeAgentTools: Record<string, AITool> = {}
): Record<string, AITool> {
  const tools: Record<string, AITool> = {}
  
  // Add selected static tools
  toolIds.forEach(id => {
    const toolDef = getToolById(id)
    if (toolDef) {
      tools[id] = toolDef.tool
    } else {
      console.warn(`Tool not found in registry: ${id}`)
    }
  })
  
  // Add agent tools (for orchestrator delegation)
  Object.entries(includeAgentTools).forEach(([id, tool]) => {
    tools[id] = tool
  })
  
  return tools
}

/**
 * Get all available tool IDs
 * @returns Array of all tool IDs in the registry
 */
export function getAllToolIds(): string[] {
  return TOOL_REGISTRY.map(tool => tool.id)
}

/**
 * Validate that tool IDs exist in registry
 * @param toolIds - Tool IDs to validate
 * @returns Object with valid and invalid tool IDs
 */
export function validateToolIds(toolIds: string[]): {
  valid: string[]
  invalid: string[]
} {
  const valid: string[] = []
  const invalid: string[] = []
  
  toolIds.forEach(id => {
    if (getToolById(id)) {
      valid.push(id)
    } else {
      invalid.push(id)
    }
  })
  
  return { valid, invalid }
}

/**
 * Get tool count by category
 * @returns Object mapping category to tool count
 */
export function getToolCountByCategory(): Record<ToolCategory, number> {
  const counts: Record<string, number> = {
    file: 0,
    context: 0,
    agent: 0,
    custom: 0,
  }
  
  TOOL_REGISTRY.forEach(tool => {
    counts[tool.category]++
  })
  
  return counts as Record<ToolCategory, number>
}
