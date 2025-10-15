import { streamText, generateText, CoreMessage, stepCountIs } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { buildToolSet, getDefaultTools } from './tools'
import { AgentConfig } from '@/store'
import ORCHESTRATOR_SYSTEM_PROMPT from './orchestrator-prompt'
import { generateToolsFromAgents } from './agent-tool-wrapper'

export class AgentService {
  /**
   * Get the provider instance based on configuration
   */
  private getProvider(config: AgentConfig) {
    if (!config.apiKey) {
      throw new Error(`API key is required for ${config.provider}`)
    }
    
    switch (config.provider) {
      case 'openrouter':
        return createOpenRouter({
          apiKey: config.apiKey,
        })
      case 'perplexity':
        return createOpenRouter({
          apiKey: config.apiKey,
          baseURL: 'https://api.perplexity.ai',
        })
      default:
        throw new Error(`Unsupported provider: ${config.provider}`)
    }
  }

  /**
   * Get the model instance
   */
  private getModel(config: AgentConfig) {
    const provider = this.getProvider(config)
    return provider(config.model)
  }

  /**
   * Execute agent with streaming (for chat interface)
   * Supports dynamic tool generation from subagents
   */
  async executeWithStreaming(
    config: AgentConfig,
    messages: CoreMessage[],
    subAgents: AgentConfig[] = [],
    maxSteps: number = 20
  ) {
    if (!config.provider || !config.model) {
      throw new Error('Agent not configured. Please configure provider and model in Agent Management.')
    }

    if (!config.apiKey) {
      throw new Error(`API key is required. Please add your ${config.provider} API key in Agent Management.`)
    }

    const model = this.getModel(config)
    
    // Use hardcoded orchestrator prompt if this is the orchestrator agent
    const isOrchestrator = config.id === 'orchestrator' || config.name === 'Orchestrator'
    const systemPrompt = isOrchestrator ? ORCHESTRATOR_SYSTEM_PROMPT : (config.systemPrompt || 'You are a helpful assistant.')
    
    const systemMessage: CoreMessage = {
      role: 'system',
      content: systemPrompt
    }
    
    // Generate tools from subagents if this is the orchestrator
    const agentTools = isOrchestrator && subAgents.length > 0 
      ? generateToolsFromAgents(subAgents)
      : {}
    
    // Build tool set from agent's selected tools
    const selectedToolIds = config.selectedTools || getDefaultTools()
    const allTools = buildToolSet(selectedToolIds, agentTools)
    
    try {
      const result = await streamText({
        model,
        messages: [systemMessage, ...messages],
        tools: allTools,
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
        stopWhen: stepCountIs(maxSteps), // Allow multiple tool execution steps
        onStepFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
          console.log('Step finished:', {
            textLength: text?.length || 0,
            toolCallsCount: toolCalls?.length || 0,
            toolResultsCount: toolResults?.length || 0,
            finishReason,
            usage
          })
        },
      })
      
      return result
    } catch (error) {
      console.error('Agent execution error:', error)
      throw error
    }
  }

  /**
   * Execute agent without streaming (for background tasks)
   */
  async executeWithoutStreaming(
    config: AgentConfig,
    messages: CoreMessage[],
    maxSteps: number = 20
  ) {
    if (!config.provider || !config.model) {
      throw new Error('Agent not configured. Please configure provider and model.')
    }

    if (!config.apiKey) {
      throw new Error('API key is required.')
    }

    const model = this.getModel(config)
    
    // Use hardcoded orchestrator prompt if this is the orchestrator agent
    const isOrchestrator = config.id === 'orchestrator' || config.name === 'Orchestrator'
    const systemPrompt = isOrchestrator ? ORCHESTRATOR_SYSTEM_PROMPT : (config.systemPrompt || 'You are a helpful assistant.')
    
    const systemMessage: CoreMessage = {
      role: 'system',
      content: systemPrompt
    }
    
    // Build tool set from agent's selected tools
    const selectedToolIds = config.selectedTools || getDefaultTools()
    const tools = buildToolSet(selectedToolIds)
    
    try {
      const result = await generateText({
        model,
        messages: [systemMessage, ...messages],
        tools,
        stopWhen: stepCountIs(maxSteps), // Allow multiple tool execution steps
      })
      
      return result
    } catch (error) {
      console.error('Agent execution error:', error)
      throw error
    }
  }

  /**
   * Delegate task to a specific agent
   */
  async delegateToAgent(
    agentConfig: AgentConfig,
    task: string,
    context?: string
  ) {
    const messages: CoreMessage[] = []
    
    if (context) {
      messages.push({
        role: 'system',
        content: `Context: ${context}`
      })
    }
    
    messages.push({
      role: 'user',
      content: task
    })
    
    return this.executeWithoutStreaming(agentConfig, messages)
  }
}

export const agentService = new AgentService()
