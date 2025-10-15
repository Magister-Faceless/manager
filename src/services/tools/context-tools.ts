/**
 * Context Management Tools
 * 
 * Tools for managing the .agent/ folder context system.
 * Enables agents to maintain persistent memory across sessions.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { contextManager } from '@/services/context-manager'

/**
 * TOOL 1: Write Context Note
 * 
 * Save important information to agent working memory that persists across sessions.
 */
export const writeContextNoteTool = tool({
  description: `Save important information to your working memory that persists across sessions. Use this to remember key findings, decisions, or project understanding. The note is saved in the .agent/ folder and persists across sessions.

Categories:
- architecture: Project structure, tech stack, design patterns
- progress: What's been accomplished, current status  
- research: Analysis findings, documentation notes
- tasks: Task planning and tracking
- notes: General notes and observations

Use this whenever you learn something important that should be remembered for future sessions.`,
  
  inputSchema: z.object({
    category: z.enum(['architecture', 'progress', 'research', 'tasks', 'notes'])
      .describe('Category of the note'),
    title: z.string()
      .describe('Brief title for the note'),
    content: z.string()
      .describe('The note content (can use Markdown formatting)'),
    append: z.boolean()
      .optional()
      .default(false)
      .describe('If true, append to existing note; if false, replace it')
  }),
  
  execute: async ({ category, title, content, append }) => {
    try {
      await contextManager.writeContextNote(category, title, content, append)
      
      return {
        success: true,
        message: `Context note saved to ${category}.md`,
        category,
        title,
        append,
        location: `.agent/${category}.md`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error saving context note',
        category
      }
    }
  }
})

/**
 * TOOL 2: Read Context Note
 * 
 * Read previously saved context notes from agent working memory.
 */
export const readContextNoteTool = tool({
  description: `Read previously saved context notes from your working memory. Use this at the start of a session to recall what you learned before, or when you need to reference past decisions. Returns the full content of the note in the specified category.`,
  
  inputSchema: z.object({
    category: z.enum(['architecture', 'progress', 'research', 'tasks', 'notes'])
      .describe('Category of the note to read')
  }),
  
  execute: async ({ category }) => {
    try {
      const content = await contextManager.readContextNote(category)
      
      if (!content) {
        return {
          success: true,
          found: false,
          message: `No ${category} note found. This category hasn't been used yet.`,
          category,
          location: `.agent/${category}.md`
        }
      }
      
      return {
        success: true,
        found: true,
        category,
        content,
        lines: content.split('\n').length,
        size: content.length,
        location: `.agent/${category}.md`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error reading context note',
        category
      }
    }
  }
})

/**
 * TOOL 3: List Context Notes
 * 
 * List all available context notes to see what has been saved.
 */
export const listContextNotesTool = tool({
  description: `List all available context notes to see what has been saved in your working memory. Use this to get an overview of what information is available from previous sessions. Returns which categories have notes and which are empty.`,
  
  inputSchema: z.object({}),
  
  execute: async () => {
    try {
      const notes = await contextManager.listContextNotes()
      
      const available = Object.entries(notes)
        .filter(([_, exists]) => exists)
        .map(([category]) => category)
      
      const notAvailable = Object.entries(notes)
        .filter(([_, exists]) => !exists)
        .map(([category]) => category)
      
      return {
        success: true,
        notes,
        available,
        notAvailable,
        totalAvailable: available.length,
        totalCategories: Object.keys(notes).length,
        message: available.length > 0 
          ? `Found ${available.length} context note(s): ${available.join(', ')}`
          : 'No context notes found yet. Start saving information with write_context_note.',
        location: '.agent/'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error listing context notes'
      }
    }
  }
})

/**
 * TOOL 4: Log Progress
 * 
 * Log progress for the current work session.
 */
export const logProgressTool = tool({
  description: `Log progress for the current work session. Use this to record what was accomplished, what's next, and any blockers. This helps maintain continuity across sessions and provides a timeline of work done. Progress logs always append to the progress.md file.`,
  
  inputSchema: z.object({
    summary: z.string()
      .describe('Brief summary of current progress'),
    achievements: z.array(z.string())
      .optional()
      .describe('List of things accomplished in this session'),
    nextSteps: z.array(z.string())
      .optional()
      .describe('List of next steps to take'),
    blockers: z.array(z.string())
      .optional()
      .describe('List of blockers or issues encountered')
  }),
  
  execute: async ({ summary, achievements, nextSteps, blockers }) => {
    try {
      await contextManager.logProgress(summary, {
        achievements,
        nextSteps,
        blockers
      })
      
      return {
        success: true,
        message: 'Progress logged successfully',
        summary,
        itemsLogged: {
          achievements: achievements?.length || 0,
          nextSteps: nextSteps?.length || 0,
          blockers: blockers?.length || 0
        },
        location: '.agent/progress.md'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error logging progress'
      }
    }
  }
})

// Export all context tools
export const contextTools = {
  write_context_note: writeContextNoteTool,
  read_context_note: readContextNoteTool,
  list_context_notes: listContextNotesTool,
  log_progress: logProgressTool,
}
