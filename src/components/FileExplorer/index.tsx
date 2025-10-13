import { useState } from 'react'
import { Folder, File, FolderPlus, FilePlus, MoreVertical, Pencil, Trash2, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useStore, FileItem } from '@/store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

export function FileExplorer() {
  const { files, addFile, updateFile, deleteFile, openFileInTab, currentFile } = useStore()
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [fileExtension, setFileExtension] = useState('.txt')
  const [selectedParent, setSelectedParent] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const rootFiles = Object.values(files).filter(f => f.parentId === null)

  const handleCreateFile = async () => {
    if (newItemName.trim()) {
      try {
        const parentPath = selectedParent ? files[selectedParent]?.path || '' : ''
        const fileName = newItemName.trim().includes('.') 
          ? newItemName.trim() 
          : `${newItemName.trim()}${fileExtension}`
        
        await addFile({
          name: fileName,
          type: 'file',
          parentId: selectedParent,
          path: parentPath ? `${parentPath}/${fileName}` : fileName,
          content: '',
        })
        setNewItemName('')
        setFileExtension('.txt')
        setShowNewFileDialog(false)
        setSelectedParent(null)
      } catch (error) {
        console.error('Failed to create file:', error)
        alert('Failed to create file. Please try again.')
      }
    }
  }

  const handleCreateFolder = async () => {
    if (newItemName.trim()) {
      try {
        const parentPath = selectedParent ? files[selectedParent]?.path || '' : ''
        await addFile({
          name: newItemName.trim(),
          type: 'folder',
          parentId: selectedParent,
          path: parentPath ? `${parentPath}/${newItemName.trim()}` : newItemName.trim(),
        })
        setNewItemName('')
        setShowNewFolderDialog(false)
        setSelectedParent(null)
      } catch (error) {
        console.error('Failed to create folder:', error)
        alert('Failed to create folder. Please try again.')
      }
    }
  }

  const handleRename = async (fileId: string) => {
    if (editName.trim()) {
      try {
        await updateFile(fileId, { name: editName.trim() })
        setEditingItem(null)
        setEditName('')
      } catch (error) {
        console.error('Failed to rename:', error)
        alert('Failed to rename. Please try again.')
        setEditingItem(null)
      }
    }
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const renderFileItem = (item: FileItem, depth: number = 0) => {
    const isExpanded = expandedFolders.has(item.id)
    const isSelected = currentFile?.id === item.id
    const isEditing = editingItem === item.id

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-1 p-1.5 rounded hover:bg-accent cursor-pointer group ${
            isSelected ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {item.type === 'folder' && (
            <button
              onClick={() => toggleFolder(item.id)}
              className="p-0.5 hover:bg-accent-foreground/10 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          
          {item.type === 'folder' ? (
            <Folder className="h-4 w-4 text-primary flex-shrink-0" />
          ) : (
            <File className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
          )}
          
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(item.id)
                if (e.key === 'Escape') setEditingItem(null)
              }}
              onBlur={() => handleRename(item.id)}
              className="h-6 text-sm flex-1"
              autoFocus
            />
          ) : (
            <span
              className="text-sm flex-1 truncate cursor-pointer"
              onClick={async () => {
                if (item.type === 'file') {
                  try {
                    await openFileInTab(item.id)
                  } catch (error) {
                    console.error('Failed to open file:', error)
                  }
                } else {
                  toggleFolder(item.id)
                }
              }}
            >
              {item.name}
            </span>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {item.type === 'folder' && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedParent(item.id)
                      setShowNewFileDialog(true)
                    }}
                  >
                    <FilePlus className="h-4 w-4 mr-2" />
                    New File
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedParent(item.id)
                      setShowNewFolderDialog(true)
                    }}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                onClick={() => {
                  setEditingItem(item.id)
                  setEditName(item.name)
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await deleteFile(item.id)
                  } catch (error) {
                    console.error('Failed to delete:', error)
                    alert('Failed to delete. Please try again.')
                  }
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {item.type === 'folder' && isExpanded && item.children && (
          <div>
            {item.children.map(childId => {
              const child = files[childId]
              return child ? renderFileItem(child, depth + 1) : null
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-sm">Files</h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowNewFileDialog(true)}
            title="New File"
          >
            <FilePlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowNewFolderDialog(true)}
            title="New Folder"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {rootFiles.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No files yet. Create a file or folder to get started.
            </div>
          ) : (
            rootFiles.map(item => renderFileItem(item))
          )}
        </div>
      </ScrollArea>

      {/* New File Dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filename">File Name</Label>
              <Input
                id="filename"
                placeholder="myfile"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Extension will be added automatically if not provided
              </p>
            </div>
            <div>
              <Label htmlFor="filetype">File Type</Label>
              <Select value={fileExtension} onValueChange={setFileExtension}>
                <SelectTrigger id="filetype">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=".txt">Text (.txt)</SelectItem>
                  <SelectItem value=".md">Markdown (.md)</SelectItem>
                  <SelectItem value=".py">Python (.py)</SelectItem>
                  <SelectItem value=".js">JavaScript (.js)</SelectItem>
                  <SelectItem value=".ts">TypeScript (.ts)</SelectItem>
                  <SelectItem value=".jsx">React JSX (.jsx)</SelectItem>
                  <SelectItem value=".tsx">React TSX (.tsx)</SelectItem>
                  <SelectItem value=".html">HTML (.html)</SelectItem>
                  <SelectItem value=".css">CSS (.css)</SelectItem>
                  <SelectItem value=".json">JSON (.json)</SelectItem>
                  <SelectItem value=".xml">XML (.xml)</SelectItem>
                  <SelectItem value=".yaml">YAML (.yaml)</SelectItem>
                  <SelectItem value=".yml">YAML (.yml)</SelectItem>
                  <SelectItem value=".sql">SQL (.sql)</SelectItem>
                  <SelectItem value=".sh">Shell Script (.sh)</SelectItem>
                  <SelectItem value=".java">Java (.java)</SelectItem>
                  <SelectItem value=".cpp">C++ (.cpp)</SelectItem>
                  <SelectItem value=".c">C (.c)</SelectItem>
                  <SelectItem value=".go">Go (.go)</SelectItem>
                  <SelectItem value=".rs">Rust (.rs)</SelectItem>
                  <SelectItem value=".php">PHP (.php)</SelectItem>
                  <SelectItem value=".rb">Ruby (.rb)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFile}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
