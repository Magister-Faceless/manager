/**
 * Tool Selector Component
 * 
 * Allows users to select which tools an agent has access to.
 * Tools are grouped by category with select all/deselect all options.
 */

import { TOOL_REGISTRY, ToolCategory } from '@/services/tools/tool-registry'
import { Label } from '@/components/ui/label'

interface ToolSelectorProps {
  selectedTools: string[]
  onChange: (selectedTools: string[]) => void
}

export function ToolSelector({ selectedTools, onChange }: ToolSelectorProps) {
  // Group tools by category
  const categories: Record<ToolCategory, typeof TOOL_REGISTRY> = {
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

  const categoryNames: Record<ToolCategory, string> = {
    file: 'File Management',
    context: 'Context Management',
    agent: 'Agent Tools',
    custom: 'Custom Tools',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-200">Available Tools</Label>
        <span className="text-xs text-gray-400">
          {selectedTools.length} / {TOOL_REGISTRY.length} selected
        </span>
      </div>

      {/* File Management Tools */}
      {categories.file.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-300">{categoryNames.file}</h4>
            <button
              onClick={() => handleSelectAll(categories.file)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              type="button"
            >
              {categories.file.every(t => selectedTools.includes(t.id)) ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-1">
            {categories.file.map(tool => (
              <label
                key={tool.id}
                className="flex items-start space-x-2 p-2 rounded hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTools.includes(tool.id)}
                  onChange={() => handleToggleTool(tool.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 font-medium">{tool.name}</div>
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
            <h4 className="text-xs font-medium text-gray-300">{categoryNames.context}</h4>
            <button
              onClick={() => handleSelectAll(categories.context)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              type="button"
            >
              {categories.context.every(t => selectedTools.includes(t.id)) ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-1">
            {categories.context.map(tool => (
              <label
                key={tool.id}
                className="flex items-start space-x-2 p-2 rounded hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTools.includes(tool.id)}
                  onChange={() => handleToggleTool(tool.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 font-medium">{tool.name}</div>
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
            <h4 className="text-xs font-medium text-gray-300">{categoryNames.agent}</h4>
            <button
              onClick={() => handleSelectAll(categories.agent)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              type="button"
            >
              {categories.agent.every(t => selectedTools.includes(t.id)) ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-1">
            {categories.agent.map(tool => (
              <label
                key={tool.id}
                className="flex items-start space-x-2 p-2 rounded hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTools.includes(tool.id)}
                  onChange={() => handleToggleTool(tool.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 font-medium">{tool.name}</div>
                  <div className="text-xs text-gray-400">{tool.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Custom Tools */}
      {categories.custom.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-300">{categoryNames.custom}</h4>
            <button
              onClick={() => handleSelectAll(categories.custom)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              type="button"
            >
              {categories.custom.every(t => selectedTools.includes(t.id)) ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-1">
            {categories.custom.map(tool => (
              <label
                key={tool.id}
                className="flex items-start space-x-2 p-2 rounded hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTools.includes(tool.id)}
                  onChange={() => handleToggleTool(tool.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 font-medium">{tool.name}</div>
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
