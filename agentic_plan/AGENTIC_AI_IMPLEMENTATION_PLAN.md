# Agentic AI Implementation Plan for Manager App

## Current State Analysis

### Existing Components
Your Manager App currently has:

✅ **UI Layer**
- Modern VSCode-inspired interface with React + TypeScript
- File explorer with hierarchical folder structure
- Multi-tab editor for simultaneous file editing
- Chat interface for AI interactions
- Agent management panel (UI only)

✅ **File System Integration**
- Browser File System Access API integration
- Real local file operations (create, read, update, delete, rename, move)
- Project-based folder management
- Scoped access to selected directories

✅ **AI Provider Setup**
- Support for 8 AI providers (OpenAI, Anthropic, Ollama, etc.)
- Dynamic model selection
- API key management
- Agent configuration storage (Orchestrator + 3 sub-agents)

❌ **Missing Components**
- No actual AI agent implementation (only UI configuration)
- No tool system for AI agents to execute actions
- No agent orchestration or collaboration
- No streaming responses or async execution
- No tool call parsing and execution

---

## Recommended Framework: **Vercel AI SDK**

### Why Vercel AI SDK?

After careful analysis, I recommend **Vercel AI SDK** for the following reasons:

#### ✅ Advantages
1. **Multi-Provider Support**: Out-of-the-box support for all your providers (OpenAI, Anthropic, etc.)
2. **Excellent Documentation**: Comprehensive guides and examples
3. **Streaming Support**: Built-in streaming for real-time responses
4. **Tool Calling**: Native support for function calling with strong typing
5. **React Integration**: Perfect integration with your React app
6. **Multi-Agent Support**: Built-in patterns for agent orchestration
7. **Active Development**: Maintained by Vercel with frequent updates
8. **TypeScript First**: Excellent type safety
9. **Lightweight**: Minimal bundle size impact
10. **Free & Open Source**: No additional costs

#### 🎯 Key Features We'll Use
- `generateText()` - For single AI completions with tools
- `streamText()` - For streaming responses in chat
- `tool()` - For defining tools agents can use
- `maxSteps` - For multi-step agent reasoning
- Provider adapters - For all 8 AI providers

### Alternative Comparison

| Feature | Vercel AI SDK | Mastra | Custom Implementation |
|---------|---------------|--------|----------------------|
| Multi-provider support | ✅ Native | ✅ Native | ❌ Manual |
| Documentation | ✅ Excellent | ⚠️ Limited | ❌ None |
| Tool system | ✅ Built-in | ✅ Built-in | ❌ Build from scratch |
| React integration | ✅ Native hooks | ⚠️ Manual | ❌ Manual |
| Streaming | ✅ Built-in | ⚠️ Manual | ❌ Manual |
| Multi-agent | ✅ Patterns | ✅ Built-in | ❌ Manual |
| Learning curve | ✅ Low | ⚠️ Medium | ❌ High |
| Maintenance | ✅ Vercel | ⚠️ Small team | ❌ You |
| Bundle size | ✅ Small | ⚠️ Medium | ✅ Minimal |

---

## Complete Tool List

### File Operations (Priority 1)
These are essential for project management:

1. **`read_file`** - Read content of a file
2. **`write_file`** - Write/update content to a file
3. **`create_file`** - Create a new file with optional content
4. **`delete_file`** - Delete a file
5. **`rename_file`** - Rename a file or folder
6. **`move_file`** - Move file/folder to different location
7. **`list_files`** - List files in a directory
8. **`create_folder`** - Create a new folder
9. **`delete_folder`** - Delete a folder and its contents
10. **`read_folder`** - Read folder structure recursively

### Search & Analysis (Priority 1)
Critical for finding information:

11. **`search_files`** - Search for files by name pattern
12. **`grep_content`** - Search for content within files (like grep)
13. **`find_and_replace`** - Find and replace text across files
14. **`get_file_info`** - Get metadata (size, modified date, etc.)

### Project Management (Priority 2)
For organizing work:

15. **`list_projects`** - List all projects
16. **`create_project`** - Create a new project
17. **`switch_project`** - Switch to a different project
18. **`get_project_structure`** - Get complete folder tree

### Editor Operations (Priority 2)
For working with open files:

19. **`open_file_in_tab`** - Open file in editor
20. **`close_tab`** - Close an open tab
21. **`get_open_tabs`** - List currently open tabs
22. **`switch_to_tab`** - Switch to a specific tab

### Content Generation (Priority 2)
For creating content:

23. **`generate_file_from_template`** - Create file from template
24. **`create_multiple_files`** - Batch create files
25. **`append_to_file`** - Append content to existing file

### Analysis & Context (Priority 3)
For understanding projects:

26. **`analyze_project_structure`** - Get project overview
27. **`get_file_statistics`** - Get file count, size, types
28. **`read_multiple_files`** - Read several files at once for context
29. **`get_recent_files`** - Get recently modified files

### Collaboration & Memory (Priority 3)
For multi-agent coordination:

30. **`save_context`** - Save important information to memory
31. **`retrieve_context`** - Retrieve saved context
32. **`share_with_agent`** - Pass information to another agent
33. **`delegate_task`** - Assign task to specialized agent

### Specialized Tools (Priority 4)
Domain-specific operations:

34. **`execute_command`** - Run shell commands (with safety checks)
35. **`install_dependency`** - Install packages (for coding projects)
36. **`run_tests`** - Execute test suites
37. **`git_operations`** - Git commands (status, commit, push, etc.)

---

## Architecture Design

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Manager App (Browser)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │     UI      │◄───┤ State Store  │◄───┤  Chat Input   │  │
│  │ Components  │    │   (Zustand)  │    │               │  │
│  └──────┬──────┘    └──────┬───────┘    └───────────────┘  │
│         │                  │                                 │
│         ▼                  ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Agent Orchestrator Service                  │  │
│  │  - Manages agent lifecycle                            │  │
│  │  - Routes messages between agents                     │  │
│  │  │  - Handles tool execution                           │  │
│  └───────────────┬──────────────────────────────────────┘  │
│                  │                                           │
│                  ▼                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Vercel AI SDK Integration Layer             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │ Orchestrator│  │   Agent 1   │  │   Agent 2   │  │   │
│  │  │   Agent     │  │  (Research) │  │  (Writing)  │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │  ┌─────────────┐                                     │   │
│  │  │   Agent 3   │                                     │   │
│  │  │  (Analysis) │                                     │   │
│  │  └─────────────┘                                     │   │
│  └───────────────┬─────────────────────────────────────┘   │
│                  │                                           │
│                  ▼                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                Tool Execution Layer                   │  │
│  │  ┌────────────┐ ┌────────────┐ ┌─────────────┐      │  │
│  │  │File System │ │  Search    │ │   Project   │      │  │
│  │  │   Tools    │ │   Tools    │ │    Tools    │      │  │
│  │  └────────────┘ └────────────┘ └─────────────┘      │  │
│  └───────────────┬──────────────────────────────────────┘  │
│                  │                                           │
│                  ▼                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        File System Access API (Browser)               │  │
│  │        - Real file operations on local disk           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  AI Providers   │
                  │  (API calls)    │
                  │ OpenAI/Anthropic│
                  │  /Ollama/etc.   │
                  └─────────────────┘
```

### Data Flow

1. **User Input** → Chat Interface
2. **Chat Interface** → Agent Orchestrator
3. **Orchestrator** → Vercel AI SDK (with context + tools)
4. **AI Model** → Decides which tools to call
5. **Tool Execution** → File System Access API
6. **Results** → Back to AI for next step
7. **Final Response** → Streamed to Chat UI

---

## Implementation Strategy

### Phase 1: Foundation (Week 1)

#### Step 1: Install Dependencies
```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic ollama-ai-provider
npm install zod  # For tool parameter validation
```

#### Step 2: Create Tool Definitions
Create `src/services/tools/file-tools.ts`:
```typescript
import { tool } from 'ai'
import { z } from 'zod'
import { fileSystemService } from '@/services/file-system'

export const readFileTool = tool({
  description: 'Read the contents of a file',
  parameters: z.object({
    path: z.string().describe('Path to the file'),
  }),
  execute: async ({ path }) => {
    // Implementation using fileSystemService
  }
})

// Define all 30+ tools...
```

#### Step 3: Create Agent Service
Create `src/services/agent-service.ts`:
```typescript
import { generateText, streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import * as tools from './tools'

export class AgentService {
  async executeAgent(config: AgentConfig, message: string) {
    const provider = this.getProvider(config)
    
    const result = await streamText({
      model: provider(config.model),
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: message }
      ],
      tools: tools,
      maxSteps: 10, // Allow multi-step reasoning
    })
    
    return result
  }
}
```

#### Step 4: Integrate with Chat Interface
Update `src/components/ChatInterface/index.tsx`:
```typescript
const handleSendMessage = async (message: string) => {
  const agentService = new AgentService()
  const stream = await agentService.executeAgent(
    orchestratorConfig,
    message
  )
  
  // Stream response to UI
  for await (const chunk of stream.textStream) {
    // Update UI in real-time
  }
}
```

### Phase 2: Core Tools (Week 2)

Implement Priority 1 tools:
- ✅ All file operations (read, write, create, delete, etc.)
- ✅ Search and grep functionality
- ✅ Project management tools

**Testing Strategy:**
- Unit tests for each tool
- Integration tests with mock file system
- E2E tests with real file operations

### Phase 3: Multi-Agent Orchestration (Week 3)

#### Agent Collaboration Pattern
```typescript
export class OrchestratorAgent {
  async handleTask(task: string) {
    // 1. Analyze task
    const analysis = await this.analyzeTask(task)
    
    // 2. Decide which agents to involve
    if (analysis.requiresResearch) {
      const researchResult = await this.delegateToAgent('agent-1', task)
    }
    
    if (analysis.requiresWriting) {
      const content = await this.delegateToAgent('agent-2', task)
    }
    
    // 3. Synthesize results
    return this.synthesizeResults([researchResult, content])
  }
}
```

#### Memory System
Create `src/services/agent-memory.ts`:
```typescript
export class AgentMemory {
  private memory: Map<string, any> = new Map()
  
  save(key: string, value: any) {
    this.memory.set(key, value)
  }
  
  retrieve(key: string) {
    return this.memory.get(key)
  }
  
  // Share context between agents
  shareContext(fromAgent: string, toAgent: string, context: any) {
    // Implementation
  }
}
```

### Phase 4: Advanced Features (Week 4)

1. **Streaming UI Updates**
   - Real-time tool execution visualization
   - Progress indicators for long-running operations
   - Intermediate results display

2. **Error Handling**
   - Graceful failure recovery
   - Retry mechanisms
   - User-friendly error messages

3. **Safety & Validation**
   - File path validation (prevent escaping project folder)
   - Dangerous operation confirmations
   - Rate limiting for API calls

4. **Performance Optimization**
   - Caching file contents
   - Debouncing file operations
   - Parallel tool execution where possible

---

## Detailed Tool Implementation Guide

### Example: Read File Tool

```typescript
// src/services/tools/file-tools.ts
import { tool } from 'ai'
import { z } from 'zod'
import { fileSystemService } from '@/services/file-system'
import { useStore } from '@/store'

export const readFileTool = tool({
  description: 'Read the contents of a file from the current project',
  parameters: z.object({
    path: z.string().describe('Relative path to the file from project root'),
  }),
  execute: async ({ path }) => {
    try {
      // Get current project files from store
      const files = useStore.getState().files
      
      // Find file by path
      const file = Object.values(files).find(f => f.path === path)
      
      if (!file) {
        return {
          success: false,
          error: `File not found: ${path}`
        }
      }
      
      // Read file content
      const content = await fileSystemService.readFile(
        file.handle as FileSystemFileHandle
      )
      
      return {
        success: true,
        path,
        content,
        size: content.length,
        lastModified: file.updatedAt
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
})
```

### Example: Search Files Tool

```typescript
export const searchFilesTool = tool({
  description: 'Search for files by name pattern in the current project',
  parameters: z.object({
    pattern: z.string().describe('File name pattern to search (supports wildcards)'),
    includeContent: z.boolean().optional().describe('Also search file contents'),
  }),
  execute: async ({ pattern, includeContent = false }) => {
    const files = useStore.getState().files
    const results: any[] = []
    
    // Convert glob pattern to regex
    const regex = new RegExp(
      pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
    )
    
    for (const file of Object.values(files)) {
      if (file.type === 'file' && regex.test(file.name)) {
        const result: any = {
          path: file.path,
          name: file.name,
          size: file.content?.length || 0
        }
        
        if (includeContent && file.handle) {
          result.content = await fileSystemService.readFile(
            file.handle as FileSystemFileHandle
          )
        }
        
        results.push(result)
      }
    }
    
    return {
      success: true,
      count: results.length,
      results
    }
  }
})
```

### Example: Create File Tool

```typescript
export const createFileTool = tool({
  description: 'Create a new file in the current project',
  parameters: z.object({
    path: z.string().describe('Path where file should be created'),
    name: z.string().describe('Name of the file including extension'),
    content: z.string().optional().describe('Initial file content'),
  }),
  execute: async ({ path, name, content = '' }) => {
    try {
      const { currentProject, files, addFile } = useStore.getState()
      
      if (!currentProject) {
        return { success: false, error: 'No project selected' }
      }
      
      // Find parent folder by path
      const parentFolder = path === '' 
        ? null 
        : Object.values(files).find(f => f.path === path && f.type === 'folder')
      
      // Create file
      await addFile({
        name,
        type: 'file',
        parentId: parentFolder?.id || null,
        path: path ? `${path}/${name}` : name,
        content
      })
      
      return {
        success: true,
        path: path ? `${path}/${name}` : name,
        message: `File created: ${name}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
})
```

---

## Integration with Existing Code

### Update Store (src/store/index.ts)

Add agent execution state:
```typescript
interface AppState {
  // ... existing properties
  
  // Agent execution state
  agentExecuting: boolean
  currentToolExecution: string | null
  executionHistory: ToolExecution[]
  
  setAgentExecuting: (executing: boolean) => void
  addToolExecution: (execution: ToolExecution) => void
}
```

### Update AI Provider Service

Modify `src/services/ai-providers.ts` to work with Vercel AI SDK:
```typescript
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { ollama } from 'ollama-ai-provider'

export function getAIProvider(config: AgentConfig) {
  switch (config.provider) {
    case 'openai':
      return createOpenAI({ apiKey: config.apiKey })
    case 'anthropic':
      return createAnthropic({ apiKey: config.apiKey })
    case 'ollama':
      return ollama()
    // ... other providers
  }
}
```

---

## Testing Strategy

### Unit Tests
```typescript
// src/services/tools/__tests__/file-tools.test.ts
describe('readFileTool', () => {
  it('should read file content successfully', async () => {
    // Mock file system
    // Execute tool
    // Assert results
  })
  
  it('should handle missing files gracefully', async () => {
    // Test error handling
  })
})
```

### Integration Tests
```typescript
describe('Agent with File Tools', () => {
  it('should read and modify files', async () => {
    // Set up test project
    // Send message to agent
    // Verify tool executions
    // Check file changes
  })
})
```

### E2E Tests
```typescript
describe('Complete Workflow', () => {
  it('should create research project structure', async () => {
    // User: "Create a research project with folders for papers, notes, and drafts"
    // Agent should use multiple tools
    // Verify final structure
  })
})
```

---

## Security Considerations

### File System Safety
1. **Path Validation**: Ensure all paths are within project folder
2. **Permission Checks**: Verify File System Access API permissions
3. **Dangerous Operations**: Confirm deletions with user

### API Key Safety
1. Store API keys securely (browser storage with encryption)
2. Never log API keys
3. Rate limit API calls

### Content Safety
1. Validate file content before writing
2. Prevent extremely large files
3. Sanitize user inputs

---

## Performance Optimization

### Caching Strategy
```typescript
class FileCache {
  private cache = new Map<string, { content: string, timestamp: number }>()
  
  get(path: string): string | null {
    const cached = this.cache.get(path)
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.content
    }
    return null
  }
  
  set(path: string, content: string) {
    this.cache.set(path, { content, timestamp: Date.now() })
  }
}
```

### Lazy Loading
- Load file contents only when needed
- Paginate large directory listings
- Stream large file operations

### Parallel Execution
- Execute independent tools in parallel
- Batch similar operations
- Use Web Workers for heavy computations

---

## Monitoring & Debugging

### Tool Execution Logging
```typescript
interface ToolExecution {
  toolName: string
  parameters: any
  result: any
  duration: number
  timestamp: number
  success: boolean
}

// Add to UI
<ToolExecutionHistory executions={executionHistory} />
```

### Agent Reasoning Visualization
Show agent's thought process:
- Which tools it considered
- Why it chose specific tools
- Step-by-step reasoning

---

## Deployment Checklist

### Before Launch
- [ ] All Priority 1 tools implemented and tested
- [ ] Multi-agent orchestration working
- [ ] Error handling comprehensive
- [ ] Security measures in place
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] User guide updated

### Post-Launch
- [ ] Monitor tool usage patterns
- [ ] Collect user feedback
- [ ] Add Priority 2 & 3 tools based on demand
- [ ] Optimize based on real usage

---

## Cost Considerations

### API Costs
- OpenAI: $0.01-0.10 per 1K tokens (depending on model)
- Anthropic: $0.25-15.00 per 1M tokens (depending on model)
- Ollama: Free (local)

### Optimization
- Use Ollama for development
- Implement token counting
- Add cost warnings for expensive operations
- Cache common responses

---

## Next Steps

### Immediate (This Week)
1. ✅ Review this plan
2. Install Vercel AI SDK
3. Implement first 5 file tools
4. Create basic agent service
5. Test with Orchestrator agent

### Short Term (2-4 Weeks)
1. Complete all Priority 1 tools
2. Implement multi-agent orchestration
3. Add streaming UI
4. Build comprehensive tests

### Long Term (1-3 Months)
1. Add Priority 2 & 3 tools
2. Implement advanced features
3. User feedback iteration
4. Performance optimization
5. Documentation and tutorials

---

## Questions & Support

### FAQ

**Q: Can agents access files outside the project folder?**
A: No. All operations are scoped to the selected project folder for security.

**Q: How many agents can work simultaneously?**
A: The orchestrator + 3 sub-agents (4 total) as designed.

**Q: Can I add custom tools?**
A: Yes! Follow the tool definition pattern in `file-tools.ts`.

**Q: What if I want to use different AI providers for different agents?**
A: Each agent config has its own provider setting. Mix and match freely.

### Resources

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Tool Calling Guide](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)
- [Multi-Agent Patterns](https://sdk.vercel.ai/docs/ai-sdk-core/agent)
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)

---

## Conclusion

This plan provides a complete roadmap for transforming your Manager App into a powerful agentic AI project management tool. By using Vercel AI SDK, you get:

✅ **Production-ready** infrastructure
✅ **Type-safe** tool definitions
✅ **Multi-provider** support
✅ **Streaming** responses
✅ **Multi-agent** coordination
✅ **Excellent** developer experience

Start with Phase 1, build incrementally, and iterate based on real usage. The modular architecture allows you to add tools progressively without disrupting existing functionality.

**Ready to start? Begin with Step 1 of Phase 1! 🚀**
