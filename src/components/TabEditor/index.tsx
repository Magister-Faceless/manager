import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, Save, FileText } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

export function TabEditor() {
  const {
    files,
    openTabs,
    activeTabId,
    currentFile,
    updateFile,
    closeTab,
    setActiveTab,
  } = useStore()

  const [content, setContent] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [unsavedTabs, setUnsavedTabs] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (currentFile) {
      setContent(currentFile.content || '')
      setHasChanges(false)
    }
  }, [currentFile])

  const handleSave = async () => {
    if (currentFile) {
      try {
        await updateFile(currentFile.id, { content })
        setHasChanges(false)
        setUnsavedTabs(prev => {
          const newSet = new Set(prev)
          newSet.delete(currentFile.id)
          return newSet
        })
      } catch (error) {
        console.error('Failed to save file:', error)
        alert('Failed to save file. Please try again.')
      }
    }
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    const changed = newContent !== (currentFile?.content || '')
    setHasChanges(changed)
    
    if (currentFile) {
      setUnsavedTabs(prev => {
        const newSet = new Set(prev)
        if (changed) {
          newSet.add(currentFile.id)
        } else {
          newSet.delete(currentFile.id)
        }
        return newSet
      })
    }
  }

  const handleCloseTab = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Check if tab has unsaved changes
    if (unsavedTabs.has(fileId)) {
      const confirmed = window.confirm('This file has unsaved changes. Close anyway?')
      if (!confirmed) return
    }
    
    closeTab(fileId)
    
    // Remove from unsaved tabs
    setUnsavedTabs(prev => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })
  }

  const getFileIcon = (_fileName: string) => {
    // You can add more specific icons based on file type
    return <FileText className="h-3 w-3" />
  }

  if (openTabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Files Open</h3>
          <p className="text-sm">
            Click on a file in the explorer to open it
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex items-center border-b bg-muted/30 overflow-x-auto">
        <ScrollArea className="flex-1">
          <div className="flex">
            {openTabs.map((fileId) => {
              const file = files[fileId]
              if (!file) return null

              const isActive = activeTabId === fileId
              const isUnsaved = unsavedTabs.has(fileId)

              return (
                <div
                  key={fileId}
                  className={`
                    flex items-center gap-2 px-3 py-2 border-r cursor-pointer
                    hover:bg-muted/50 transition-colors min-w-[120px] max-w-[200px]
                    ${isActive ? 'bg-background border-b-2 border-b-primary' : 'bg-muted/30'}
                  `}
                  onClick={() => setActiveTab(fileId)}
                >
                  {getFileIcon(file.name)}
                  <span className="text-sm truncate flex-1">
                    {file.name}
                  </span>
                  {isUnsaved && (
                    <span className="text-xs text-primary">●</span>
                  )}
                  <button
                    onClick={(e) => handleCloseTab(fileId, e)}
                    className="hover:bg-muted rounded p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Editor Content */}
      {currentFile && (
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              {getFileIcon(currentFile.name)}
              <span className="text-sm font-medium">{currentFile.name}</span>
              {hasChanges && (
                <span className="text-xs text-muted-foreground">(modified)</span>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>

          {/* Editor Area */}
          <div className="flex-1 p-4">
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full resize-none font-mono text-sm"
              placeholder="Start typing..."
            />
          </div>

          {/* Editor Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground bg-muted/20">
            <div className="flex items-center gap-4">
              <span>{content.length} characters</span>
              <span>{content.split('\n').length} lines</span>
            </div>
            <div>
              {currentFile.updatedAt && (
                <span>
                  Last modified: {new Date(currentFile.updatedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
