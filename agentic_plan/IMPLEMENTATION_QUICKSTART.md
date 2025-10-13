# Implementation Quick Start

Get your agentic AI system running in 30 minutes!

## Step-by-Step Implementation

### Step 1: Install Dependencies (5 min)

```bash
# Install Vercel AI SDK and providers
npm install ai @ai-sdk/openai @ai-sdk/anthropic ollama-ai-provider

# Install validation library
npm install zod

# Install for better type safety
npm install --save-dev @types/node
```

### Step 2: Create Tools Directory Structure (2 min)

```bash
# Create the tools directory
mkdir -p src/services/tools
```

Create these files:
- `src/services/tools/index.ts` - Export all tools
- `src/services/tools/file-tools.ts` - File operation tools
- `src/services/tools/search-tools.ts` - Search tools
- `src/services/tools/project-tools.ts` - Project management tools
- `src/services/tools/types.ts` - Shared types

### Step 3: Create Basic File Tools (10 min)

Create `src/services/tools/file-tools.ts`:

```typescript
import { tool } from 'ai'
import { z } from 'zod'
import { fileSystemService } from '@/services/file-system'
import { useStore } from '@/store'

// Read File Tool
export const readFileTool = tool({
  description: 'Read the contents of a file from the current project',
  parameters: z.object({
    path: z.string().describe('Relative path to the file from project root'),
  }),
  execute: async ({ path }) => {
    try {
      const files = useStore.getState().files
      const file = Object.values(files).find(f => f.path === path && f.type === 'file')
      
      if (!file || !file.handle) {
        return {
          success: false,
          error: `File not found: ${path}`
        }
      }
      
      const content = await fileSystemService.readFile(file.handle as FileSystemFileHandle)
      
      return {
        success: true,
        path,
        content,
        size: content.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
})

// Write File Tool
export const writeFileTool = tool({
  description: 'Write or update content in a file',
  parameters: z.object({
    path: z.string().describe('Path to the file'),
    content: z.string().describe('New content to write'),
  }),
  execute: async ({ path, content }) => {
    try {
      const { files, updateFile } = useStore.getState()
      const file = Object.values(files).find(f => f.path === path && f.type === 'file')
      
      if (!file) {
        return { success: false, error: `File not found: ${path}` }
      }
      
      await updateFile(file.id, { content })
      
      return {
        success: true,
        path,
        bytesWritten: content.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
})

// Create File Tool
export const createFileTool = tool({
  description: 'Create a new file with optional initial content',
  parameters: z.object({
    name: z.string().describe('File name including extension'),
    path: z.string().optional().describe('Parent directory path (empty for root)'),
    content: z.string().optional().describe('Initial file content'),
  }),
  execute: async ({ name, path = '', content = '' }) => {
    try {
      const { files, addFile } = useStore.getState()
      
      // Find parent folder
      const parentFolder = path === '' 
        ? null 
        : Object.values(files).find(f => f.path === path && f.type === 'folder')
      
      const fullPath = path ? `${path}/${name}` : name
      
      await addFile({
        name,
        type: 'file',
        parentId: parentFolder?.id || null,
        path: fullPath,
        content
      })
      
      return {
        success: true,
        path: fullPath,
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

// List Files Tool
export const listFilesTool = tool({
  description: 'List all files and folders in a directory',
  parameters: z.object({
    path: z.string().optional().describe('Directory path (empty for root)'),
    recursive: z.boolean().optional().describe('Include subdirectories'),
  }),
  execute: async ({ path = '', recursive = false }) => {
    try {
      const files = useStore.getState().files
      const allFiles = Object.values(files)
      
      let results = allFiles.filter(f => {
        if (path === '') {
          return f.parentId === null
        }
        const parentFile = allFiles.find(pf => pf.path === path)
        if (recursive) {
          return f.path.startsWith(path + '/')
        }
        return f.parentId === parentFile?.id
      })
      
      const fileList = results.map(f => ({
        name: f.name,
        path: f.path,
        type: f.type,
        size: f.content?.length || 0
      }))
      
      return {
        success: true,
        files: fileList,
        totalCount: fileList.length
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

### Step 4: Export Tools (2 min)

Create `src/services/tools/index.ts`:

```typescript
import { readFileTool, writeFileTool, createFileTool, listFilesTool } from './file-tools'

export const tools = {
  read_file: readFileTool,
  write_file: writeFileTool,
  create_file: createFileTool,
  list_files: listFilesTool,
}

export default tools
```

### Step 5: Create Agent Service (8 min)

Create `src/services/agent-service.ts`:

```typescript
import { streamText, generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { ollama } from 'ollama-ai-provider'
import tools from './tools'
import { AgentConfig } from '@/store'

export class AgentService {
  private getProvider(config: AgentConfig) {
    switch (config.provider) {
      case 'openai':
        return createOpenAI({ apiKey: config.apiKey })
      case 'anthropic':
        return createAnthropic({ apiKey: config.apiKey })
      case 'ollama':
        return ollama()
      default:
        throw new Error(`Unsupported provider: ${config.provider}`)
    }
  }

  private getModel(config: AgentConfig) {
    const provider = this.getProvider(config)
    return provider(config.model)
  }

  async executeWithStreaming(
    config: AgentConfig,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ) {
    const model = this.getModel(config)
    
    const result = await streamText({
      model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        ...messages
      ],
      tools,
      maxSteps: 10, // Allow agent to use multiple tools
    })
    
    return result
  }

  async executeWithoutStreaming(
    config: AgentConfig,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ) {
    const model = this.getModel(config)
    
    const result = await generateText({
      model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        ...messages
      ],
      tools,
      maxSteps: 10,
    })
    
    return result
  }
}

export const agentService = new AgentService()
```

### Step 6: Update Chat Interface (3 min)

Modify `src/components/ChatInterface/index.tsx` to use the agent service:

```typescript
import { agentService } from '@/services/agent-service'

// Inside your component, update the send message function:
const handleSendMessage = async (messageText: string) => {
  if (!messageText.trim()) return
  
  const orchestrator = useStore.getState().orchestrator
  if (!orchestrator || !orchestrator.provider || !orchestrator.model) {
    alert('Please configure the Orchestrator agent first!')
    return
  }
  
  // Add user message
  addMessage({ role: 'user', content: messageText })
  setInput('')
  setIsLoading(true)
  
  try {
    // Get conversation history
    const messages = currentSession?.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })) || []
    
    // Add current message
    messages.push({ role: 'user', content: messageText })
    
    // Execute agent with streaming
    const result = await agentService.executeWithStreaming(orchestrator, messages)
    
    let fullResponse = ''
    
    // Stream the response
    for await (const chunk of result.textStream) {
      fullResponse += chunk
      // Update UI in real-time (you can optimize this with debouncing)
    }
    
    // Add assistant response
    addMessage({ role: 'assistant', content: fullResponse })
    
  } catch (error) {
    console.error('Error executing agent:', error)
    addMessage({ 
      role: 'assistant', 
      content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  } finally {
    setIsLoading(false)
  }
}
```

## Testing Your Implementation

### Test 1: Basic File Reading

1. Create a test file in your project folder
2. In the chat, type: "Read the contents of test.txt"
3. The agent should use the `read_file` tool and return the contents

### Test 2: File Creation

1. In the chat, type: "Create a file called notes.md with the content 'Hello World'"
2. Check your file explorer - the file should appear
3. The agent should confirm the creation

### Test 3: List Files

1. In the chat, type: "What files are in my project?"
2. The agent should use `list_files` and show all files

### Test 4: Multi-Step Operation

1. In the chat, type: "Create a summary.md file that lists all the files in my project"
2. The agent should:
   - Use `list_files` to get the file list
   - Use `create_file` to create summary.md with the list

## Common Issues & Solutions

### Issue: "Provider not found"
**Solution:** Make sure you installed the provider package:
```bash
npm install @ai-sdk/openai @ai-sdk/anthropic
```

### Issue: "API key invalid"
**Solution:** 
1. Check your API key in Agent Management panel
2. Verify the key is correct for the selected provider
3. Check provider's dashboard for key status

### Issue: "Tools not working"
**Solution:**
1. Check browser console for errors
2. Verify file system permissions
3. Make sure a project is selected

### Issue: "Streaming not working"
**Solution:**
1. Check if provider supports streaming
2. Try without streaming using `generateText` instead
3. Check network tab for errors

## Next Steps

### Add More Tools (Priority Order)

1. **Search Tools** (30 min)
   - `search_files` - Find files by name
   - `grep_content` - Search within files

2. **Project Tools** (20 min)
   - `get_project_structure` - Get folder tree
   - `list_projects` - List all projects

3. **Editor Tools** (20 min)
   - `open_file_in_tab` - Open in editor
   - `get_open_tabs` - List open files

4. **Advanced File Tools** (40 min)
   - `rename_file` - Rename files/folders
   - `move_file` - Move items
   - `delete_file` - Delete with confirmation
   - `find_and_replace` - Bulk text replacement

### Enhance UI (Optional)

1. **Tool Execution Visualization**
   - Show which tools are being used
   - Display tool parameters and results
   - Add execution timeline

2. **Streaming Improvements**
   - Smooth text animation
   - Tool call indicators
   - Progress bars for long operations

3. **Error Handling**
   - Better error messages
   - Retry mechanisms
   - User confirmations for dangerous operations

### Multi-Agent Setup

1. Configure sub-agents in Agent Management
2. Add delegation tools
3. Implement agent coordination logic
4. Test agent collaboration

## Configuration Tips

### Orchestrator Agent System Prompt

```
You are a helpful project management assistant. You help users organize their projects, manage files, and complete tasks efficiently.

You have access to tools for:
- Reading and writing files
- Creating and organizing folders
- Searching for files and content
- Managing the project structure

Always:
1. Confirm before deleting or overwriting files
2. Provide clear explanations of what you're doing
3. Use multiple tools when needed to complete complex tasks
4. Ask for clarification if the request is ambiguous

When creating files, use appropriate formatting (Markdown, plain text, etc.).
When searching, provide relevant context with results.
```

### Research Agent System Prompt

```
You are a research specialist. Your job is to:
- Find relevant files and information in the project
- Analyze content and extract key insights
- Organize research materials
- Create summaries and reports

Focus on thoroughness and accuracy. Always cite sources (file paths) when providing information.
```

### Writing Agent System Prompt

```
You are a writing specialist. Your job is to:
- Create well-structured documents
- Edit and improve existing content
- Follow style guidelines
- Organize written materials

Focus on clarity, coherence, and proper formatting. Ask about tone and style preferences when creating new content.
```

## Performance Tips

1. **Cache File Contents**: Store recently accessed files in memory
2. **Batch Operations**: Combine multiple file reads when possible
3. **Lazy Loading**: Don't read large files unless necessary
4. **Use Appropriate Models**: Fast models for simple tasks, powerful models for complex ones

## Security Checklist

- ✅ All file operations scoped to project folder
- ✅ No path traversal vulnerabilities
- ✅ API keys stored securely
- ✅ Dangerous operations require confirmation
- ✅ Input validation on all tool parameters

## Success Metrics

Track these to measure success:
- Tool success rate (should be >95%)
- Average response time
- User satisfaction
- Most used tools
- Error patterns

## Getting Help

1. Check the main implementation plan: `AGENTIC_AI_IMPLEMENTATION_PLAN.md`
2. Review tool definitions: `TOOLS_REFERENCE.md`
3. Read Vercel AI SDK docs: https://sdk.vercel.ai/docs
4. Check browser console for errors
5. Test tools individually before integration

## Congratulations! 🎉

You now have a working agentic AI system that can:
- ✅ Understand natural language requests
- ✅ Use tools to manipulate files
- ✅ Execute multi-step operations
- ✅ Stream responses in real-time

Keep building, add more tools, and enhance the capabilities!
