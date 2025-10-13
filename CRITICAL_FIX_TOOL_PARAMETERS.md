# CRITICAL FIX: Tool Parameter Schema Issue

## Issue Report - Tool Calls with Empty Parameters

### Problem Description
The AI agent was calling tools multiple times but with **empty parameters** `{}`, causing all values to be `undefined`. This resulted in:
- Folders created without names
- Files created without names or content
- All operations failing with "undefined" errors
- Tools executing but with no actual effect

### User's Conversation Example
```
User: "Create a folder named 'plan', then inside the folder create a file 'plan.md' and write some keywords"

Result:
🔧 Step 1 - Tool: create_folder
{}  ← EMPTY PARAMETERS!

✅ Result:
{
  "success": true,
  "message": "Successfully created folder: undefined at undefined"  ← undefined values!
}
```

The agent tried 18 times but all with empty `{}` parameters!

---

## Root Cause Analysis

### The Investigation

After reviewing:
1. ✅ **Development documentation** - Confirmed `maxSteps: 20` was already implemented
2. ✅ **Vercel AI SDK docs** - Found the correct tool definition format
3. ✅ **Agent service** - Confirmed proper configuration with `stopWhen: stepCountIs(maxSteps)`
4. ❌ **Tool definitions** - **FOUND THE ISSUE!**

### The Problem

**All tools were using `parameters` instead of `inputSchema`**

### Vercel AI SDK Specification

According to [Vercel AI SDK Tool Documentation](../vercel/tool1.md):

Tools must be defined with THREE elements:
1. **`description`** - Optional description
2. **`inputSchema`** - Zod schema or JSON schema (**NOT `parameters`!**)
3. **`execute`** - Async function that executes the tool

### What Was Wrong

```typescript
// ❌ INCORRECT - Using 'parameters'
export const createFileTool = tool({
  description: 'Create a new file...',
  parameters: z.object({  // ← WRONG!
    name: z.string(),
    path: z.string().optional(),
    content: z.string().optional(),
  }),
  execute: async ({ name, path, content }) => {
    // name, path, content are all undefined!
  }
})
```

### What's Correct

```typescript
// ✅ CORRECT - Using 'inputSchema'
export const createFileTool = tool({
  description: 'Create a new file...',
  inputSchema: z.object({  // ← CORRECT!
    name: z.string(),
    path: z.string().optional(),
    content: z.string().optional(),
  }),
  execute: async ({ name, path, content }) => {
    // Now name, path, content have proper values!
  }
})
```

---

## The Fix Applied

### File Modified
`src/services/tools/file-tools.ts`

### Changes Made

Changed **ALL 5 tools** from `parameters` to `inputSchema`:

1. **`readFileTool`** - ✅ Fixed
2. **`writeFileTool`** - ✅ Fixed
3. **`createFileTool`** - ✅ Fixed
4. **`createFolderTool`** - ✅ Fixed
5. **`listFilesTool`** - ✅ Fixed

Also cleaned up unused variable in `writeFileTool`.

---

## Why This Happened

This was **NOT** a memory issue or agent configuration problem. The issue was:
- **API compatibility** - Using wrong property name for tool schema
- **SDK compliance** - Not following Vercel AI SDK specification
- The tools were defined, but the LLM couldn't access the schema properly
- Without the schema, parameter extraction failed, resulting in empty `{}` objects

---

## How to Verify the Fix

### Test Case
```
User: "Create a folder named 'plan', then inside create a file 'plan.md' with content about iron deficiency anemia keywords"
```

### Expected Result (After Fix)
```
🔧 Step 1 - Tool: create_folder
{
  "name": "plan",
  "path": ""
}

✅ Result:
{
  "success": true,
  "path": "plan",
  "name": "plan",
  "message": "Successfully created folder: plan at plan"
}

🔧 Step 2 - Tool: create_file
{
  "name": "plan.md",
  "path": "plan",
  "content": "# Iron Deficiency Anemia Keywords\n\n- Hemoglobin\n- Ferritin\n- Anemia symptoms..."
}

✅ Result:
{
  "success": true,
  "path": "plan/plan.md",
  "message": "Successfully created file: plan/plan.md"
}
```

---

## Key Takeaways

### What Was NOT the Issue
- ❌ Not a memory issue - Agent doesn't need to "remember" what it did
- ❌ Not a `maxSteps` issue - Already configured correctly (`maxSteps: 20`)
- ❌ Not an agent definition issue - Agent was properly configured
- ❌ Not a streaming issue - Stream processing was correct

### What WAS the Issue
- ✅ **Tool schema property name** - Must use `inputSchema`, not `parameters`
- ✅ **Vercel AI SDK compliance** - Must follow exact API specification
- ✅ **Parameter extraction** - Without correct schema property, parameters can't be extracted

### Important Lessons

1. **Always refer to official SDK documentation** for exact API specifications
2. **Property names matter** - `inputSchema` ≠ `parameters`
3. **Vercel AI SDK is strict** - Incorrect property names cause silent failures
4. **Test early** - Tool definitions should be tested immediately after creation

---

## Vercel AI SDK Tool Definition Reference

### Complete Tool Structure

```typescript
import { tool } from 'ai'
import { z } from 'zod'

export const myTool = tool({
  // 1. DESCRIPTION (optional but recommended)
  description: 'What this tool does and when to use it',
  
  // 2. INPUT SCHEMA (required for tools with parameters)
  inputSchema: z.object({
    param1: z.string().describe('Description for the LLM'),
    param2: z.number().optional().describe('Optional parameter'),
  }),
  
  // 3. EXECUTE FUNCTION (required)
  execute: async ({ param1, param2 }) => {
    // Implementation
    return { result: 'success' }
  }
})
```

### Using Tools in Agent Service

```typescript
import { streamText, stepCountIs } from 'ai'
import tools from './tools'

const result = await streamText({
  model,
  messages,
  tools,  // ← Pass all tools
  stopWhen: stepCountIs(20),  // ← Allow multi-step execution
})
```

---

## Documentation References

- **Vercel AI SDK Tool Calling**: `vercel/tool1.md`
- **Agent Building**: `vercel/agent2.md`
- **Multi-Step Execution**: `MULTI_TOOL_FIX.md`
- **Tool Execution Display**: `TOOL_EXECUTION_FIX.md`

---

## Status

✅ **ISSUE RESOLVED**

All tools now use the correct `inputSchema` property and are compliant with Vercel AI SDK specification. The agent should now properly extract parameters and execute tools with the correct arguments.

**Date Fixed**: October 13, 2025, 3:45 PM UTC+08:00
