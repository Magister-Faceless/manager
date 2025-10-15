import { useState, useRef, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useStore } from '@/store'
import { Loader2, Bot, Download, Upload, Trash2, Plus, X, GripVertical } from 'lucide-react'
import { CreateAgentForm } from './CreateAgentForm'
import { SubagentEditForm } from './SubagentEditForm'
import { AgentConfig } from '@/store'
import { OrchestratorConfigForm } from './OrchestratorConfigForm'

interface OpenTab {
  id: string
  type: 'orchestrator' | 'subagent' | 'create'
  label: string
  agentId?: string
}

export function AgentManagement() {
  const { 
    orchestrator, 
    subAgents, 
    updateOrchestrator, 
    createSubAgent,
    updateSubAgent,
    deleteSubAgent,
    exportAgentSettings,
    importAgentSettings,
    clearAgentSettings,
  } = useStore()

  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [leftColumnWidth, setLeftColumnWidth] = useState(320) // Default 320px
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const settings = await exportAgentSettings()
      
      const blob = new Blob([settings], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `agent-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export settings')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        setIsImporting(true)
        const text = await file.text()
        await importAgentSettings(text)
        alert('Settings imported successfully!')
      } catch (error) {
        console.error('Import failed:', error)
        alert('Failed to import settings. Please check the file format.')
      } finally {
        setIsImporting(false)
      }
    }
    input.click()
  }

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all agent settings? This cannot be undone.')) {
      try {
        await clearAgentSettings()
        alert('All agent settings have been cleared.')
      } catch (error) {
        console.error('Clear failed:', error)
        alert('Failed to clear settings')
      }
    }
  }

  const existingAgentNames = [
    orchestrator?.name,
    ...subAgents.map(a => a.name),
  ].filter(Boolean) as string[]

  const openTab = (tab: OpenTab) => {
    // Check if tab already exists
    const existingTab = openTabs.find(t => t.id === tab.id)
    if (existingTab) {
      setActiveTabId(tab.id)
      return
    }
    // Add new tab
    setOpenTabs([...openTabs, tab])
    setActiveTabId(tab.id)
  }

  const closeTab = (tabId: string) => {
    const newTabs = openTabs.filter(t => t.id !== tabId)
    setOpenTabs(newTabs)
    // If closing active tab, switch to first remaining tab or null
    if (activeTabId === tabId) {
      setActiveTabId(newTabs.length > 0 ? newTabs[0].id : null)
    }
  }

  const handleCreateAgent = async (config: Omit<AgentConfig, 'id'>) => {
    await createSubAgent(config)
    // Close the create tab
    closeTab('create-new')
  }

  const handleConfigureOrchestrator = () => {
    openTab({
      id: 'orchestrator-config',
      type: 'orchestrator',
      label: 'Orchestrator',
    })
  }

  const handleSelectAgent = (agent: AgentConfig) => {
    openTab({
      id: `agent-${agent.id}`,
      type: 'subagent',
      label: agent.name,
      agentId: agent.id,
    })
  }

  const handleCreateNew = () => {
    openTab({
      id: 'create-new',
      type: 'create',
      label: 'Create Agent',
    })
  }

  const handleDeleteAgent = async (id: string) => {
    await deleteSubAgent(id)
    // Close the tab for this agent
    closeTab(`agent-${id}`)
  }

  // Handle mouse down on resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return
      
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left
      
      // Constrain width between 250px and 600px
      const constrainedWidth = Math.min(Math.max(newWidth, 250), 600)
      setLeftColumnWidth(constrainedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  return (
    <div ref={containerRef} className="flex h-full min-h-0 relative overflow-hidden">
      {/* Left Column - Agent List */}
      <div 
        className="flex flex-col border-r flex-shrink-0 overflow-hidden" 
        style={{ width: `${leftColumnWidth}px` }}
      >
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-5 w-5" />
            <h2 className="font-semibold">Agents</h2>
          </div>
          
          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Download className="h-3 w-3 mr-1" />
              )}
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              disabled={isImporting}
              className="flex-1"
            >
              {isImporting ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Upload className="h-3 w-3 mr-1" />
              )}
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>

          <Button
            onClick={handleCreateNew}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Orchestrator Section */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Orchestrator</h3>
              <button
                onClick={handleConfigureOrchestrator}
                className="w-full text-left p-3 rounded-md border hover:bg-muted transition-colors"
              >
                <div className="font-medium">Main Orchestrator</div>
                <div className="text-xs mt-1 text-muted-foreground">
                  {orchestrator?.provider || 'Not configured'}
                  {orchestrator?.model && ` • ${orchestrator.model}`}
                </div>
              </button>
            </div>

            {/* Subagents Section */}
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Subagents ({subAgents.length})
              </h3>
              {subAgents.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4 border rounded-md">
                  No subagents yet
                </div>
              ) : (
                <div className="space-y-2">
                  {subAgents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleSelectAgent(agent)}
                      className="w-full text-left p-3 rounded-md border hover:bg-muted transition-colors"
                    >
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-xs mt-1 text-muted-foreground line-clamp-2">
                        {agent.description}
                      </div>
                      <div className="text-xs mt-2 text-muted-foreground">
                        {agent.provider} • {agent.model}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 hover:w-2 bg-transparent hover:bg-primary/20 cursor-col-resize transition-all flex items-center justify-center group ${
          isResizing ? 'bg-primary/30 w-2' : ''
        }`}
        style={{ flexShrink: 0 }}
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Middle Column - Tabbed Configuration */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {openTabs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Select an agent to configure</p>
              <p className="text-sm mt-2">or create a new one</p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTabId || undefined} onValueChange={setActiveTabId} className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
            <div className="border-b flex-shrink-0 overflow-x-auto">
              <TabsList className="h-auto p-0 bg-transparent w-full justify-start rounded-none">
                {openTabs.map((tab) => (
                  <div key={tab.id} className="relative group inline-block">
                    <TabsTrigger
                      value={tab.id}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
                    >
                      {tab.label}
                    </TabsTrigger>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        closeTab(tab.id)
                      }}
                      className="absolute top-1/2 -translate-y-1/2 right-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </TabsList>
            </div>

            {openTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="flex-1 m-0 overflow-y-auto p-0">
                <div className="min-h-0">
                  {tab.type === 'create' && (
                    <CreateAgentForm
                      onCreateAgent={handleCreateAgent}
                      onCancel={() => closeTab(tab.id)}
                      existingAgentNames={existingAgentNames}
                    />
                  )}

                  {tab.type === 'orchestrator' && (
                    <OrchestratorConfigForm
                      config={orchestrator}
                      onUpdate={updateOrchestrator}
                      onClose={() => closeTab(tab.id)}
                    />
                  )}

                  {tab.type === 'subagent' && tab.agentId && (() => {
                    const agent = subAgents.find(a => a.id === tab.agentId)
                  return agent ? (
                    <SubagentEditForm
                      agent={agent}
                      onUpdate={updateSubAgent}
                      onDelete={handleDeleteAgent}
                      onClose={() => closeTab(tab.id)}
                      existingAgentNames={existingAgentNames}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      Agent not found
                    </div>
                  )
                })()}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  )
}
