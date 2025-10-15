import { useState, useEffect, useRef } from 'react'
import { FileExplorer } from './components/FileExplorer'
import { RightPanel } from './components/RightPanel'
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
import { FolderOpen, Plus, AlertCircle, GripVertical } from 'lucide-react'
import { fileSystemService, FileSystemService } from './services/file-system'

export default function App() {
  const {
    projects,
    currentProject,
    addProject,
    selectProject,
    openTabs,
    loadAgentSettings,
  } = useStore()

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<FileSystemDirectoryHandle | null>(null)
  const [error, setError] = useState('')
  
  // File Explorer resize state
  const [fileExplorerWidth, setFileExplorerWidth] = useState(256) // Default w-64 = 256px
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Right Panel resize state
  const [rightPanelWidth, setRightPanelWidth] = useState(384) // Default w-96 = 384px
  const [isResizingRight, setIsResizingRight] = useState(false)

  // Load agent settings on app startup
  useEffect(() => {
    loadAgentSettings()
  }, [loadAgentSettings])

  // Handle file explorer resize
  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingLeft(true)
  }
  
  // Handle right panel resize
  const handleMouseDownRight = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingRight(true)
  }

  // Handle left resize (file explorer)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingLeft || !containerRef.current) return
      
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left
      
      // Constrain width between 200px and 500px
      const constrainedWidth = Math.min(Math.max(newWidth, 200), 500)
      setFileExplorerWidth(constrainedWidth)
    }

    const handleMouseUp = () => {
      setIsResizingLeft(false)
    }

    if (isResizingLeft) {
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
  }, [isResizingLeft])
  
  // Handle right resize (right panel)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRight || !containerRef.current) return
      
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = containerRect.right - e.clientX
      
      // Constrain width between 300px and 800px
      const constrainedWidth = Math.min(Math.max(newWidth, 300), 800)
      setRightPanelWidth(constrainedWidth)
    }

    const handleMouseUp = () => {
      setIsResizingRight(false)
    }

    if (isResizingRight) {
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
  }, [isResizingRight])

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

      </div>

      {/* Main Content - 3 Column Layout */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left Column: File Explorer */}
        <div 
          className="border-r flex-shrink-0" 
          style={{ width: `${fileExplorerWidth}px` }}
        >
          <FileExplorer />
        </div>

        {/* Left Resize Handle */}
        <div
          onMouseDown={handleMouseDownLeft}
          className={`w-1 hover:w-2 bg-transparent hover:bg-primary/20 cursor-col-resize transition-all flex items-center justify-center group ${
            isResizingLeft ? 'bg-primary/30 w-2' : ''
          }`}
          style={{ flexShrink: 0 }}
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Middle Column: File Editor with Tabs */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {currentProject ? (
            openTabs.length > 0 ? (
              <TabEditor />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center max-w-md">
                  <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h2 className="text-xl font-bold mb-2">No Files Open</h2>
                  <p className="text-sm">
                    Click on a file in the explorer to open it in the editor.
                  </p>
                </div>
              </div>
            )
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

        {/* Right Resize Handle */}
        <div
          onMouseDown={handleMouseDownRight}
          className={`w-1 hover:w-2 bg-transparent hover:bg-primary/20 cursor-col-resize transition-all flex items-center justify-center group ${
            isResizingRight ? 'bg-primary/30 w-2' : ''
          }`}
          style={{ flexShrink: 0 }}
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        {/* Right Column: AI Chat & Settings */}
        <div 
          className="right-panel-container h-full min-h-0 border-l flex-shrink-0"
          style={{ width: `${rightPanelWidth}px` }}
        >
          <RightPanel />
        </div>
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
