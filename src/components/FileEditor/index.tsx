import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Save, FileText } from 'lucide-react'

export function FileEditor() {
  const { currentFile, updateFile } = useStore()
  const [content, setContent] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

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
      } catch (error) {
        console.error('Failed to save file:', error)
        alert('Failed to save file. Please try again.')
      }
    }
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasChanges(newContent !== (currentFile?.content || ''))
  }

  if (!currentFile) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No file selected</p>
          <p className="text-sm">Select a file from the explorer to view and edit</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <h2 className="font-semibold">{currentFile.name}</h2>
          {hasChanges && (
            <span className="text-xs text-muted-foreground">(unsaved)</span>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          size="sm"
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-full font-mono text-sm resize-none"
          placeholder="Start typing..."
        />
      </div>

      {/* Footer */}
      <div className="border-t p-2 px-4 text-xs text-muted-foreground flex items-center justify-between">
        <div>
          Last modified: {new Date(currentFile.updatedAt).toLocaleString()}
        </div>
        <div>
          {content.length} characters
        </div>
      </div>
    </div>
  )
}
