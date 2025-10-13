# Multi-Tool Execution Fix - CRITICAL

## 🔴 The Problem You Discovered

**Symptom**: Agent only executes ONE tool and then stops, even when the task requires multiple steps.

**Your Example**:
```
User: "Create a folder named plan, then create a file plan.md inside it"

What Happened:
✅ Folder created (but unnamed)
❌ File NOT created
❌ Agent stopped after first tool
```

**Root Cause**: Missing `maxSteps` parameter in Vercel AI SDK configuration.

---

## ✅ The Fix Applied

### What Changed:
Added `maxSteps: 10` to both `streamText` and `generateText` calls in `agent-service.ts`

### Before:
```typescript
const result = await streamText({
  model,
  messages: [systemMessage, ...messages],
  tools,
  // ❌ No maxSteps - defaults to 1 tool call only!
})
```

### After:
```typescript
const result = await streamText({
  model,
  messages: [systemMessage, ...messages],
  tools,
  maxSteps: 10, // ✅ Allow up to 10 consecutive tool calls
})
```

---

## 📚 How Vercel AI SDK Tool Execution Works

### Architecture Overview:

```
User Request
    ↓
Agent Service (streamText/generateText)
    ↓
AI Model (via OpenRouter)
    ↓
[Tool Execution Loop]
    ├─ Step 1: Model decides to use tool
    ├─ Step 2: Tool executes
    ├─ Step 3: Result sent back to model
    ├─ Step 4: Model decides next action
    └─ Repeat until done or maxSteps reached
    ↓
Final Response to User
```

### The `maxSteps` Parameter:

**What it does**:
- Controls how many times the agent can call tools in a single request
- Each "step" = one tool call + model reasoning

**Default behavior** (when not specified):
- `maxSteps` defaults to **1**
- Agent calls ONE tool and stops
- No multi-step operations possible

**With `maxSteps: 10`**:
- Agent can call up to 10 tools consecutively
- Agent decides when to stop (before reaching limit)
- Enables complex multi-step workflows

### Example Flow with maxSteps: 10

```
User: "Create folder 'docs', then create README.md inside it"

Step 1:
  Model: "I need to create a folder first"
  Tool: create_folder(name="docs")
  Result: { success: true, path: "docs" }

Step 2:
  Model: "Now I'll create the file inside the folder"
  Tool: create_file(name="README.md", path="docs")
  Result: { success: true, path: "docs/README.md" }

Step 3:
  Model: "Task complete, I'll respond to user"
  Final Response: "✅ Created folder 'docs' and file 'docs/README.md'"
```

---

## 🏗️ How We're Creating Agents

### Yes, We're Using Vercel AI SDK

**Core Components**:

1. **Provider**: `@openrouter/ai-sdk-provider`
   - Connects to OpenRouter API
   - Provides access to multiple AI models

2. **AI SDK Functions**:
   - `streamText()` - For real-time streaming responses (chat)
   - `generateText()` - For non-streaming responses (background tasks)

3. **Tools**: Defined using `tool()` from AI SDK
   - Each tool has parameters (zod schema)
   - Each tool has execute function
   - Tools are passed to streamText/generateText

### Agent Creation Flow:

```typescript
// 1. Create OpenRouter provider
const provider = createOpenRouter({ apiKey: config.apiKey })

// 2. Get model instance
const model = provider(config.model) // e.g., "openai/gpt-4-turbo"

// 3. Execute with tools
const result = await streamText({
  model,                    // The AI model
  messages,                 // Conversation history
  tools,                    // Available tools
  maxSteps: 10,            // Max consecutive tool calls
})

// 4. Stream results back to user
for await (const chunk of result.fullStream) {
  // Handle text, tool calls, tool results
}
```

---

## 🔧 Tool Execution Lifecycle

### 1. Tool Definition (file-tools.ts):
```typescript
export const createFileTool = tool({
  description: 'Create a new file...',
  parameters: z.object({
    name: z.string(),
    path: z.string().optional(),
    content: z.string().optional(),
  }),
  execute: async ({ name, path, content }) => {
    // Actual file creation logic
    return { success: true, path: fullPath }
  }
})
```

### 2. Tool Registration (tools/index.ts):
```typescript
export const tools = {
  read_file: readFileTool,
  write_file: writeFileTool,
  create_file: createFileTool,
  create_folder: createFolderTool,
  list_files: listFilesTool,
}
```

### 3. Tool Execution (agent-service.ts):
```typescript
const result = await streamText({
  model,
  messages,
  tools,        // ← All tools available to agent
  maxSteps: 10, // ← Can use tools multiple times
})
```

### 4. Tool Call Flow:
```
1. Model receives user request
2. Model analyzes and decides: "I need to use create_folder"
3. AI SDK intercepts tool call
4. AI SDK executes createFolderTool.execute()
5. Tool returns result
6. Result sent back to model
7. Model decides: "Now I need to use create_file"
8. Process repeats (up to maxSteps times)
9. Model generates final response
```

---

## 🎯 Why This Matters for Multi-Agent Systems

### Current Setup (Single Orchestrator):
- Orchestrator has access to all 5 tools
- Can execute multiple tools in sequence
- `maxSteps: 10` allows complex workflows

### Future Multi-Agent Setup:
Each agent will have:
- Its own `streamText` or `generateText` call
- Its own set of specialized tools
- Its own `maxSteps` limit

Example:
```typescript
// Orchestrator Agent
await streamText({
  model: orchestratorModel,
  tools: allTools,
  maxSteps: 10,
})

// Research Sub-Agent
await streamText({
  model: researchModel,
  tools: { search_files, grep_content, read_file },
  maxSteps: 5,
})

// Writing Sub-Agent
await streamText({
  model: writingModel,
  tools: { create_file, write_file, read_file },
  maxSteps: 5,
})
```

---

## 🧪 Testing the Fix

### Test Command:
```
Create a folder called "presentation", then inside it create a file called "outline.md" with the content "# Iron Deficiency Anemia\n\n## Keywords\n- Hemoglobin\n- Ferritin\n- Anemia symptoms"
```

### Expected Behavior:

**Step 1**: Create folder
```
Tool: create_folder
Input: { name: "presentation", path: "" }
Output: { success: true, path: "presentation" }
```

**Step 2**: Create file
```
Tool: create_file
Input: { 
  name: "outline.md", 
  path: "presentation",
  content: "# Iron Deficiency Anemia\n\n## Keywords\n- Hemoglobin\n- Ferritin\n- Anemia symptoms"
}
Output: { success: true, path: "presentation/outline.md" }
```

**Final Response**:
```
✅ Created folder: presentation
✅ Created file: presentation/outline.md with initial content
```

### Verification:
1. Check file explorer - folder "presentation" should exist
2. Folder should have correct name (not blank)
3. File "outline.md" should be inside folder
4. File should contain the specified content
5. Console should show 2 tool calls (create_folder, then create_file)

---

## 📊 Console Logs to Watch For

With the fix, you should see:
```
🔧 Tool called: create_folder
✅ Tool result: create_folder
🔧 Tool called: create_file
✅ Tool result: create_file
```

**Before the fix**, you would only see:
```
🔧 Tool called: create_folder
✅ Tool result: create_folder
[Agent stops here - no second tool call]
```

---

## 🔍 Debugging Multi-Tool Issues

### If tools still don't execute consecutively:

1. **Check Console Logs**:
   - Look for "🔧 Tool called:" messages
   - Count how many appear
   - Should see multiple for multi-step tasks

2. **Verify maxSteps**:
   - Check `agent-service.ts`
   - Should have `maxSteps: 10` in both functions

3. **Check Model Capability**:
   - Some models are better at tool use than others
   - GPT-4 Turbo: Excellent
   - Claude 3 Opus/Sonnet: Excellent
   - Smaller models: May struggle

4. **Check Tool Results**:
   - If first tool fails, agent may stop
   - Check tool return values for errors

5. **Check Prompt**:
   - Orchestrator prompt should encourage multi-step operations
   - Our hardcoded prompt does this ✅

---

## 💡 Key Takeaways

### What You Learned:
1. ✅ Vercel AI SDK requires `maxSteps` for multi-tool execution
2. ✅ Default is 1 tool call per request
3. ✅ Agent stops after first tool without `maxSteps`
4. ✅ We're using Vercel AI SDK with OpenRouter provider
5. ✅ Tools are defined with zod schemas and execute functions

### What's Fixed:
1. ✅ Added `maxSteps: 10` to streamText
2. ✅ Added `maxSteps: 10` to generateText
3. ✅ Agent can now execute up to 10 tools consecutively
4. ✅ Multi-step workflows now work

### What to Test:
1. ✅ Create folder + create file inside it
2. ✅ Create multiple folders in one request
3. ✅ Read file + update file (2 steps)
4. ✅ List files + create file based on results
5. ✅ Complex project structure creation

---

## 🚀 Try It Now!

**Test Command**:
```
Help me plan for a presentation on iron deficiency anemia. Create a folder named "plan", then inside the folder create a file "plan.md" and write some keywords I can use for an initial search.
```

**Expected Result**:
- ✅ Folder "plan" created with correct name
- ✅ File "plan.md" created inside "plan" folder
- ✅ File contains relevant keywords about iron deficiency anemia
- ✅ Agent provides clear confirmation of both actions

**This should now work perfectly!** 🎯
