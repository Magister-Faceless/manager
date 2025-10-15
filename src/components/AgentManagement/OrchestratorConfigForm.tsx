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
import { Loader2, Save, X } from 'lucide-react'
import { AgentConfig } from '@/store'
import { ToolSelector } from './ToolSelector'
import { getDefaultTools } from '@/services/tools'

interface OrchestratorConfigFormProps {
  config: AgentConfig | null
  onUpdate: (config: Partial<AgentConfig>) => void
  onClose: () => void
}

export function OrchestratorConfigForm({
  config,
  onUpdate,
  onClose,
}: OrchestratorConfigFormProps) {
  const [provider, setProvider] = useState(config?.provider || 'openrouter')
  const [apiKey, setApiKey] = useState(config?.apiKey || '')
  const [model, setModel] = useState(config?.model || '')
  const [systemPrompt, setSystemPrompt] = useState(config?.systemPrompt || '')
  const [temperature, setTemperature] = useState<number>(config?.temperature || 0.7)
  const [maxTokens, setMaxTokens] = useState<number>(config?.maxTokens || 2000)
  const [selectedTools, setSelectedTools] = useState<string[]>(config?.selectedTools || getDefaultTools())
  
  const [models, setModels] = useState<AIModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState('')

  const providersList = Object.values(AI_PROVIDERS).filter(
    p => p.id === 'openrouter' || p.id === 'perplexity'
  )

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

  const handleSave = () => {
    onUpdate({
      provider,
      apiKey,
      model,
      systemPrompt,
      temperature,
      maxTokens,
      selectedTools,
    })
  }

  const selectedProvider = AI_PROVIDERS[provider]

  return (
    <div className="flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Configure Orchestrator</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            The orchestrator is the main agent that coordinates all tasks and delegates to specialized subagents when needed.
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
            <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Leave empty to use default orchestrator prompt..."
              className="min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the built-in orchestrator prompt. Only customize if you need specific behavior.
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

          {/* Tool Selection */}
          <div className="space-y-2">
            <ToolSelector
              selectedTools={selectedTools}
              onChange={setSelectedTools}
            />
          </div>
      </div>

      <div className="p-4 border-t flex gap-2">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </div>
    </div>
  )
}
