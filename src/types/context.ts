/**
 * Context Management Types
 * 
 * Types for the .agent/ folder context management system.
 * Enables agents to maintain persistent memory across sessions.
 */

export type ContextCategory = 
  | 'architecture'  // Project structure, tech stack, design patterns
  | 'progress'      // What's been accomplished, current status
  | 'research'      // Analysis findings, documentation notes
  | 'tasks'         // Task planning and tracking
  | 'notes'         // General notes and observations

export interface ContextNote {
  category: ContextCategory
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface ProgressEntry {
  summary: string
  achievements?: string[]
  nextSteps?: string[]
  blockers?: string[]
  timestamp: string
}

export interface ContextMetadata {
  projectName: string
  lastUpdated: string
  categories: Record<ContextCategory, boolean> // Which categories have content
}
