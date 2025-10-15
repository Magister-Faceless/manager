import { tool } from 'ai'
import { z } from 'zod'
import { AgentConfig } from '@/store'
import { agentService } from './agent-service'

/**
 * Create a tool that wraps an agent execution
 * This allows the orchestrator to delegate tasks to subagents
 */
export function createAgentTool(agentConfig: AgentConfig) {
  return tool({
    description: agentConfig.description, // This is what the orchestrator sees
    inputSchema: z.object({
      task: z.string().describe('The specific task to delegate to this agent'),
      context: z.string().optional().describe('Additional context or information for the task'),
    }),
    execute: async ({ task, context }) => {
      try {
        // Delegate to the subagent
        const result = await agentService.delegateToAgent(
          agentConfig,
          task,
          context
        )
        
        return {
          success: true,
          result: result.text,
          agentName: agentConfig.name,
        }
      } catch (error) {
        console.error(`Error executing agent ${agentConfig.name}:`, error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          agentName: agentConfig.name,
        }
      }
    },
  })
}

/**
 * Generate tools from an array of agent configurations
 * Returns an object with tool names as keys
 */
export function generateToolsFromAgents(agents: AgentConfig[]) {
  const tools: Record<string, any> = {}
  
  for (const agent of agents) {
    // Use agent ID as tool name to ensure uniqueness
    const toolName = `delegate_to_${agent.id}`
    tools[toolName] = createAgentTool(agent)
  }
  
  return tools
}
