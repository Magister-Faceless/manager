import axios from 'axios'

export interface AIModel {
  id: string
  name: string
  description?: string
}

export interface AIProvider {
  id: string
  name: string
  requiresApiKey: boolean
  getModels: (apiKey?: string) => Promise<AIModel[]>
}

// OpenAI Provider
const openaiProvider: AIProvider = {
  id: 'openai',
  name: 'OpenAI',
  requiresApiKey: true,
  getModels: async (apiKey) => {
    if (!apiKey) throw new Error('API key required for OpenAI')
    
    try {
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })
      
      return response.data.data
        .filter((model: any) => model.id.includes('gpt'))
        .map((model: any) => ({
          id: model.id,
          name: model.id,
          description: model.id,
        }))
    } catch (error) {
      console.error('Error fetching OpenAI models:', error)
      // Return default models as fallback
      return [
        { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', description: 'Most capable model' },
        { id: 'gpt-4', name: 'GPT-4', description: 'Previous generation' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
      ]
    }
  },
}

// Anthropic Provider
const anthropicProvider: AIProvider = {
  id: 'anthropic',
  name: 'Anthropic',
  requiresApiKey: true,
  getModels: async (apiKey) => {
    if (!apiKey) throw new Error('API key required for Anthropic')
    
    // Anthropic doesn't have a models endpoint, return known models
    return [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable model' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and compact' },
      { id: 'claude-2.1', name: 'Claude 2.1', description: 'Previous generation' },
    ]
  },
}

// OpenRouter Provider
const openrouterProvider: AIProvider = {
  id: 'openrouter',
  name: 'OpenRouter',
  requiresApiKey: true,
  getModels: async (apiKey) => {
    if (!apiKey) throw new Error('API key required for OpenRouter')
    
    try {
      const response = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })
      
      return response.data.data.map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        description: model.description,
      }))
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error)
      return [
        { id: 'openai/gpt-4-turbo-preview', name: 'GPT-4 Turbo (OpenRouter)', description: 'Via OpenRouter' },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus (OpenRouter)', description: 'Via OpenRouter' },
      ]
    }
  },
}

// XAI Provider
const xaiProvider: AIProvider = {
  id: 'xai',
  name: 'X.AI',
  requiresApiKey: true,
  getModels: async (apiKey) => {
    if (!apiKey) throw new Error('API key required for X.AI')
    
    // X.AI models (Grok)
    return [
      { id: 'grok-beta', name: 'Grok Beta', description: 'X.AI\'s Grok model' },
      { id: 'grok-1', name: 'Grok 1', description: 'First generation Grok' },
    ]
  },
}

// DeepSeek Provider
const deepseekProvider: AIProvider = {
  id: 'deepseek',
  name: 'DeepSeek',
  requiresApiKey: true,
  getModels: async (apiKey) => {
    if (!apiKey) throw new Error('API key required for DeepSeek')
    
    try {
      const response = await axios.get('https://api.deepseek.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })
      
      return response.data.data.map((model: any) => ({
        id: model.id,
        name: model.id,
        description: model.id,
      }))
    } catch (error) {
      console.error('Error fetching DeepSeek models:', error)
      return [
        { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'DeepSeek chat model' },
        { id: 'deepseek-coder', name: 'DeepSeek Coder', description: 'DeepSeek coding model' },
      ]
    }
  },
}

// Qwen Provider
const qwenProvider: AIProvider = {
  id: 'qwen',
  name: 'Qwen',
  requiresApiKey: true,
  getModels: async (apiKey) => {
    if (!apiKey) throw new Error('API key required for Qwen')
    
    // Qwen models from Alibaba Cloud
    return [
      { id: 'qwen-turbo', name: 'Qwen Turbo', description: 'Fast Qwen model' },
      { id: 'qwen-plus', name: 'Qwen Plus', description: 'Enhanced Qwen model' },
      { id: 'qwen-max', name: 'Qwen Max', description: 'Most capable Qwen model' },
    ]
  },
}

// Z.AI Provider
const zaiProvider: AIProvider = {
  id: 'zai',
  name: 'Z.AI',
  requiresApiKey: true,
  getModels: async (apiKey) => {
    if (!apiKey) throw new Error('API key required for Z.AI')
    
    // Z.AI models
    return [
      { id: 'z-ai-1', name: 'Z.AI Model 1', description: 'Z.AI base model' },
      { id: 'z-ai-pro', name: 'Z.AI Pro', description: 'Z.AI professional model' },
    ]
  },
}

// Ollama Provider (Local)
const ollamaProvider: AIProvider = {
  id: 'ollama',
  name: 'Ollama',
  requiresApiKey: false,
  getModels: async () => {
    try {
      const response = await axios.get('http://localhost:11434/api/tags')
      
      return response.data.models.map((model: any) => ({
        id: model.name,
        name: model.name,
        description: `Size: ${(model.size / 1e9).toFixed(2)} GB`,
      }))
    } catch (error) {
      console.error('Error fetching Ollama models:', error)
      return [
        { id: 'llama2', name: 'Llama 2', description: 'Meta\'s Llama 2 model' },
        { id: 'mistral', name: 'Mistral', description: 'Mistral AI model' },
        { id: 'codellama', name: 'Code Llama', description: 'Code-focused Llama model' },
      ]
    }
  },
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  openrouter: openrouterProvider,
  xai: xaiProvider,
  deepseek: deepseekProvider,
  qwen: qwenProvider,
  zai: zaiProvider,
  ollama: ollamaProvider,
}

export const getProviderModels = async (
  providerId: string,
  apiKey?: string
): Promise<AIModel[]> => {
  const provider = AI_PROVIDERS[providerId]
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`)
  }
  
  return provider.getModels(apiKey)
}
