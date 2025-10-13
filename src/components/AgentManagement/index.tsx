import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/store'
import { AI_PROVIDERS, getProviderModels, AIModel } from '@/services/ai-providers'
import { Loader2, Save, Bot } from 'lucide-react'

export function AgentManagement() {
  const { orchestrator, subAgents, updateOrchestrator, updateSubAgent } = useStore()

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h2 className="font-semibold">Agent Configuration</h2>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue="orchestrator" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="orchestrator">Orchestrator</TabsTrigger>
              <TabsTrigger value="agent1">Agent 1</TabsTrigger>
              <TabsTrigger value="agent2">Agent 2</TabsTrigger>
              <TabsTrigger value="agent3">Agent 3</TabsTrigger>
            </TabsList>

            {/* Orchestrator Agent */}
            <TabsContent value="orchestrator" className="space-y-4 mt-4">
              <div className="text-sm text-muted-foreground mb-4">
                The orchestrator is the main agent that users interact with. It coordinates with sub-agents to complete tasks.
              </div>
              <AgentConfigForm
                config={orchestrator}
                onUpdate={updateOrchestrator}
                agentName="Orchestrator"
              />
            </TabsContent>

            {/* Sub Agents */}
            <TabsContent value="agent1" className="space-y-4 mt-4">
              <div className="text-sm text-muted-foreground mb-4">
                Sub-agent 1 can be configured to handle specific tasks like research, analysis, or specialized operations.
              </div>
              <AgentConfigForm
                config={subAgents[0]}
                onUpdate={(config) => updateSubAgent(0, config)}
                agentName="Sub Agent 1"
              />
            </TabsContent>

            <TabsContent value="agent2" className="space-y-4 mt-4">
              <div className="text-sm text-muted-foreground mb-4">
                Sub-agent 2 can be configured to handle specific tasks like research, analysis, or specialized operations.
              </div>
              <AgentConfigForm
                config={subAgents[1]}
                onUpdate={(config) => updateSubAgent(1, config)}
                agentName="Sub Agent 2"
              />
            </TabsContent>

            <TabsContent value="agent3" className="space-y-4 mt-4">
              <div className="text-sm text-muted-foreground mb-4">
                Sub-agent 3 can be configured to handle specific tasks like research, analysis, or specialized operations.
              </div>
              <AgentConfigForm
                config={subAgents[2]}
                onUpdate={(config) => updateSubAgent(2, config)}
                agentName="Sub Agent 3"
              />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}

interface AgentConfigFormProps {
  config: any
  onUpdate: (config: any) => void
  agentName: string
}

function AgentConfigForm({ config, onUpdate, agentName }: AgentConfigFormProps) {
  const [provider, setProvider] = useState(config?.provider || '')
  const [apiKey, setApiKey] = useState(config?.apiKey || '')
  const [model, setModel] = useState(config?.model || '')
  const [systemPrompt, setSystemPrompt] = useState(config?.systemPrompt || '')
  const [models, setModels] = useState<AIModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState('')

  const providersList = Object.values(AI_PROVIDERS)

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
      name: agentName,
    })
  }

  const selectedProvider = AI_PROVIDERS[provider]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="provider">AI Provider</Label>
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

      {selectedProvider && selectedProvider.requiresApiKey && (
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
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

      {provider && (!selectedProvider.requiresApiKey || apiKey) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="model">Model</Label>
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
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex flex-col">
                    <span>{m.name}</span>
                    {m.description && (
                      <span className="text-xs text-muted-foreground">
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
          {!loadingModels && models.length === 0 && !modelsError && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadModels}
              className="w-full"
            >
              Retry Loading Models
            </Button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System Prompt</Label>
        <Textarea
          id="systemPrompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Define the agent's behavior, role, and capabilities..."
          className="min-h-[150px] font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          The system prompt defines how the agent behaves and what tasks it can perform.
        </p>
      </div>

      <Button onClick={handleSave} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        Save Configuration
      </Button>

      {config && (
        <div className="p-3 bg-muted rounded-md text-xs space-y-1">
          <div className="font-semibold">Current Configuration:</div>
          <div>Provider: {config.provider || 'Not set'}</div>
          <div>Model: {config.model || 'Not set'}</div>
          <div>API Key: {config.apiKey ? '••••••••' : 'Not set'}</div>
        </div>
      )}
    </div>
  )
}
