import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AI_PROVIDERS, getProviderModels, AIModel } from '@/services/ai-providers'
import { Loader2, AlertCircle } from 'lucide-react'
import { AgentConfig } from '@/store'

interface CreateAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateAgent: (config: Omit<AgentConfig, 'id'>) => Promise<void>
  existingAgentNames: string[]
}

export function CreateAgentDialog({
  open,
  onOpenChange,
  onCreateAgent,
  existingAgentNames,
}: CreateAgentDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [provider, setProvider] = useState('openrouter')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState<number>(0.7)
  const [maxTokens, setMaxTokens] = useState<number>(2000)
  
  const [models, setModels] = useState<AIModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState('')
  const [nameError, setNameError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const providersList = Object.values(AI_PROVIDERS).filter(
    p => p.id === 'openrouter' || p.id === 'perplexity'
  )

  // Load models when provider or API key changes
  useEffect(() => {
    if (provider && apiKey) {
      loadModels()
    } else {
      setModels([])
      setModel('')
    }
  }, [provider, apiKey])

  const loadModels = async () => {
    setLoadingModels(true)
    setModelsError('')
    try {
      const fetchedModels = await getProviderModels(provider, apiKey)
      setModels(fetchedModels)
    } catch (error) {
      setModelsError(error instanceof Error ? error.message : 'Failed to load models')
      setModels([])
    } finally {
      setLoadingModels(false)
    }
  }

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError('Agent name is required')
      return false
    }
    if (existingAgentNames.includes(value.trim())) {
      setNameError('An agent with this name already exists')
      return false
    }
    setNameError('')
    return true
  }

  const validateDescription = (value: string): boolean => {
    if (!value.trim()) {
      setDescriptionError('Description is required')
      return false
    }
    const wordCount = value.trim().split(/\s+/).length
    if (wordCount > 500) {
      setDescriptionError(`Description must be less than 500 words (currently ${wordCount} words)`)
      return false
    }
    setDescriptionError('')
    return true
  }

  const handleCreate = async () => {
    // Validate all fields
    const isNameValid = validateName(name)
    const isDescriptionValid = validateDescription(description)

    if (!isNameValid || !isDescriptionValid) {
      return
    }

    if (!provider || !apiKey || !model || !systemPrompt.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setIsCreating(true)
      await onCreateAgent({
        name: name.trim(),
        description: description.trim(),
        provider,
        apiKey,
        model,
        systemPrompt: systemPrompt.trim(),
        temperature,
        maxTokens,
      })
      
      // Reset form
      setName('')
      setDescription('')
      setProvider('openrouter')
      setApiKey('')
      setModel('')
      setSystemPrompt('')
      setTemperature(0.7)
      setMaxTokens(2000)
      setModels([])
      setNameError('')
      setDescriptionError('')
      
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create agent:', error)
      alert('Failed to create agent. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const selectedProvider = AI_PROVIDERS[provider]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Configure a new specialized agent. The orchestrator will use the description to decide when to delegate tasks to this agent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Agent Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Agent Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                validateName(e.target.value)
              }}
              placeholder="e.g., Research Specialist"
              className={nameError ? 'border-destructive' : ''}
            />
            {nameError && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {nameError}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                validateDescription(e.target.value)
              }}
              placeholder="Describe what this agent specializes in and when the orchestrator should use it..."
              className={`min-h-[100px] ${descriptionError ? 'border-destructive' : ''}`}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {description.trim().split(/\s+/).filter(w => w).length} / 500 words
              </span>
              {descriptionError && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {descriptionError}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              This description helps the orchestrator understand when and how to use this agent.
            </p>
          </div>

          {/* AI Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">
              AI Provider <span className="text-destructive">*</span>
            </Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providersList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key */}
          {selectedProvider && selectedProvider.requiresApiKey && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                API Key <span className="text-destructive">*</span>
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never sent to our servers.
              </p>
            </div>
          )}

          {/* Model */}
          {provider && (!selectedProvider.requiresApiKey || apiKey) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="model">
                  Model <span className="text-destructive">*</span>
                </Label>
                {loadingModels && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading models...
                  </div>
                )}
              </div>
              <Select value={model} onValueChange={setModel} disabled={loadingModels}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex flex-col max-w-[400px]">
                        <span className="font-medium">{m.name}</span>
                        {m.description && (
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {m.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {modelsError && (
                <p className="text-xs text-destructive">{modelsError}</p>
              )}
            </div>
          )}

          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">
              System Prompt <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Define the agent's behavior, role, and capabilities..."
              className="min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              The system prompt defines how the agent behaves and what tasks it can perform.
            </p>
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Controls randomness (0-2)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min="100"
                max="32000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Maximum response length
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Agent'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
