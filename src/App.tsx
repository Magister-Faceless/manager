import { useState } from 'react'
import { FileExplorer } from './components/FileExplorer'
import { ChatInterface } from './components/ChatInterface'
import { AgentManagement } from './components/AgentManagement'
import { TabEditor } from './components/TabEditor'
import { useStore } from './store'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select'
import { FolderOpen, Plus, Bot, FileText, MessageSquare, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { fileSystemService, FileSystemService } from './services/file-system'

export default function App() {
  const {
    projects,
    currentProject,
    addProject,
    selectProject,
    showAgentPanel,
    toggleAgentPanel,
    openTabs,
  } = useStore()

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<FileSystemDirectoryHandle | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'editor'>('chat')
  const [error, setError] = useState('')

  const handleSelectFolder = async () => {
    try {
      setError('')
      const { handle, path } = await fileSystemService.selectDirectory()
      setSelectedFolder(handle)
      if (!newProjectName) {
        setNewProjectName(path)
      }
    } catch (error) {
      if (error instanceof Error) {
        if (!error.message.includes('cancelled')) {
          setError(error.message)
        }
      }
    }
  }

  const handleCreateProject = () => {
    if (newProjectName.trim() && selectedFolder) {
      addProject({
        name: newProjectName.trim(),
        path: selectedFolder.name,
        directoryHandle: selectedFolder,
      })
      setNewProjectName('')
      setSelectedFolder(null)
      setShowNewProjectDialog(false)
      setError('')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top Bar */}
      <div className="border-b p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-lg">Project Manager AI</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Select
              value={currentProject?.id || ''}
              onValueChange={selectProject}
            >
              <SelectTrigger className="w-[200px] h-8">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewProjectDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Project
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showAgentPanel ? 'default' : 'outline'}
            size="sm"
            onClick={toggleAgentPanel}
          >
            <Bot className="h-4 w-4 mr-1" />
            {showAgentPanel ? 'Hide' : 'Show'} Agents
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer Sidebar */}
        <div className="w-64 border-r">
          <FileExplorer />
        </div>

        {/* Center Content Area */}
        <div className="flex-1 flex flex-col">
          {currentProject ? (
            <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'chat' | 'editor')} className="flex-1 flex flex-col">
              <div className="border-b px-4">
                <TabsList className="h-10">
                  <TabsTrigger value="chat" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="editor" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Editor
                    {openTabs.length > 0 && (
                      <span className="text-xs text-muted-foreground">({openTabs.length})</span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="chat" className="flex-1 m-0">
                <ChatInterface />
              </TabsContent>
              
              <TabsContent value="editor" className="flex-1 m-0 h-full">
                <TabEditor />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center max-w-md">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold mb-2">Welcome to Project Manager AI</h2>
                <p className="text-sm mb-6">
                  Get started by creating a new project or selecting an existing one from the dropdown above.
                </p>
                <Button onClick={() => setShowNewProjectDialog(true)} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Agent Management Panel */}
        {showAgentPanel && (
          <div className="w-96 border-l">
            <AgentManagement />
          </div>
        )}
      </div>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={(open) => {
        setShowNewProjectDialog(open)
        if (!open) {
          setNewProjectName('')
          setSelectedFolder(null)
          setError('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!FileSystemService.isSupported() && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Browser Not Supported</p>
                  <p className="text-muted-foreground mt-1">
                    Your browser doesn't support the File System Access API. Please use Chrome, Edge, or another Chromium-based browser.
                  </p>
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-1 block">Project Folder</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 justify-start"
                  onClick={handleSelectFolder}
                  disabled={!FileSystemService.isSupported()}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {selectedFolder ? selectedFolder.name : 'Select Folder...'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Choose a folder on your computer. All project files will be stored here.
              </p>
            </div>
            
            {selectedFolder && (
              <div>
                <label className="text-sm font-medium mb-1 block">Project Name</label>
                <Input
                  placeholder="My Research Project"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
            )}
            
            {error && (
              <div className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={!newProjectName.trim() || !selectedFolder}
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
