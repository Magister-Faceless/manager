import { useState, useEffect } from 'react'
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
import { Loader2, Save, X, Trash2, AlertCircle } from 'lucide-react'
import { AgentConfig } from '@/store'
import { ToolSelector } from './ToolSelector'
import { getDefaultTools } from '@/services/tools'

interface SubagentEditFormProps {
  agent: AgentConfig
  onUpdate: (id: string, config: Partial<AgentConfig>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
  existingAgentNames: string[]
}

export function SubagentEditForm({
  agent,
  onUpdate,
  onDelete,
  onClose,
  existingAgentNames,
}: SubagentEditFormProps) {
  const [name, setName] = useState(agent.name)
  const [description, setDescription] = useState(agent.description)
  const [provider, setProvider] = useState(agent.provider)
  const [apiKey, setApiKey] = useState(agent.apiKey)
  const [model, setModel] = useState(agent.model)
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt)
  const [temperature, setTemperature] = useState<number>(agent.temperature || 0.7)
  const [maxTokens, setMaxTokens] = useState<number>(agent.maxTokens || 2000)
  const [selectedTools, setSelectedTools] = useState<string[]>(agent.selectedTools || getDefaultTools())
  
  const [models, setModels] = useState<AIModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState('')
  const [nameError, setNameError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const providersList = Object.values(AI_PROVIDERS).filter(
    p => p.id === 'openrouter' || p.id === 'perplexity'
  )

  // Load models when provider or API key changes
  useEffect(() => {
    if (provider && apiKey) {
      loadModels()
    } else {
      setModels([])
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
    // Check if name exists in other agents (exclude current agent)
    const otherNames = existingAgentNames.filter(n => n !== agent.name)
    if (otherNames.includes(value.trim())) {
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

  const handleSave = async () => {
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
      setIsSaving(true)
      await onUpdate(agent.id, {
        name: name.trim(),
        description: description.trim(),
        provider,
        apiKey,
        model,
        systemPrompt: systemPrompt.trim(),
        temperature,
        maxTokens,
        selectedTools,
      })
    } catch (error) {
      console.error('Failed to update agent:', error)
      alert('Failed to update agent. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${agent.name}"? This cannot be undone.`)) {
      try {
        await onDelete(agent.id)
      } catch (error) {
        console.error('Failed to delete agent:', error)
        alert('Failed to delete agent')
      }
    }
  }

  const selectedProvider = AI_PROVIDERS[provider]

  return (
    <div className="flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Edit Agent: {agent.name}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
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
              placeholder="Describe what this agent specializes in..."
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
              placeholder="Define the agent's behavior..."
              className="min-h-[120px] font-mono text-sm"
            />
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
            </div>
          </div>

          {/* Tool Selection */}
          <div className="space-y-2">
            <ToolSelector
              selectedTools={selectedTools}
              onChange={setSelectedTools}
            />
          </div>
      </div>

      <div className="p-4 border-t space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          className="w-full"
          size="sm"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Agent
        </Button>
      </div>
    </div>
  )
}
