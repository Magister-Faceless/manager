import { streamText, generateText, CoreMessage, stepCountIs } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import tools from './tools'
import { AgentConfig } from '@/store'
import ORCHESTRATOR_SYSTEM_PROMPT from './orchestrator-prompt'

export class AgentService {
  /**
   * Get the OpenRouter provider instance
   */
  private getProvider(config: AgentConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required for OpenRouter')
    }
    
    return createOpenRouter({
      apiKey: config.apiKey,
    })
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
   */
  async executeWithStreaming(
    config: AgentConfig,
    messages: CoreMessage[],
    maxSteps: number = 20
  ) {
    if (!config.provider || !config.model) {
      throw new Error('Agent not configured. Please configure provider and model in Agent Management.')
    }

    if (!config.apiKey) {
      throw new Error('API key is required. Please add your OpenRouter API key in Agent Management.')
    }

    const model = this.getModel(config)
    
    // Use hardcoded orchestrator prompt if this is the orchestrator agent
    const isOrchestrator = config.id === 'orchestrator' || config.name === 'Orchestrator'
    const systemPrompt = isOrchestrator ? ORCHESTRATOR_SYSTEM_PROMPT : (config.systemPrompt || 'You are a helpful assistant.')
    
    const systemMessage: CoreMessage = {
      role: 'system',
      content: systemPrompt
    }
    
    try {
      const result = await streamText({
        model,
        messages: [systemMessage, ...messages],
        tools,
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
