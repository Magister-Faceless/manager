# Complete Implementation Plan - Context Management + Dynamic Tool Selection

**Status**: Approved  
**Priority**: HIGH  
**Total Estimated Time**: 10-12 hours  

## Overview

Implement two major features:
1. **Context Management System** - `.agent/` folder with 4 new tools
2. **Dynamic Tool Selection** - Per-agent tool configuration via UI

---

## Combined Implementation Phases

### Phase 1: Context Management Foundation (3 hours)

#### 1.1 Create Type Definitions
**File**: `src/types/context.ts`

```typescript
export type ContextCategory = 'architecture' | 'progress' | 'research' | 'tasks' | 'notes'

export interface ContextNote {
  category: ContextCategory
  title: string
  content: string
  createdAt: string
  updatedAt: string
}
```

**Actions**:
- [ ] Create types file
- [ ] Export from types index

---

#### 1.2 Create Context Manager Service
**File**: `src/services/context-manager.ts`

**Key Features**:
- Initialize `.agent/` folder (visible to users)
- Create README.md explaining the folder
- Read/write context notes
- Log progress

**Actions**:
- [ ] Implement ContextManager class
- [ ] Add folder initialization
- [ ] Add CRUD operations for notes
- [ ] Test folder creation

---

#### 1.3 Create Context Tools
**File**: `src/services/tools/context-tools.ts`

**4 New Tools**:
1. `write_context_note` - Save context
2. `read_context_note` - Retrieve context
3. `list_context_notes` - List available notes
4. `log_progress` - Track progress

**Actions**:
- [ ] Implement all 4 tools
- [ ] Add proper descriptions
- [ ] Test each tool

---

#### 1.4 Initialize on Project Load
**File**: `src/store/index.ts`

**Modify**:
- `addProject` - Initialize context manager
- `selectProject` - Initialize context manager

**Actions**:
- [ ] Add context manager initialization
- [ ] Test with new project
- [ ] Test with existing project
- [ ] Verify `.agent/` folder is created and accessible

---

### Phase 2: Dynamic Tool System (4-5 hours)

#### 2.1 Create Tool Registry
**File**: `src/services/tools/tool-registry.ts`

**Features**:
- Central registry of all tools
- Tool metadata (name, description, category)
- Default enabled flags
- Tool builder function

**Actions**:
- [ ] Create ToolDefinition interface
- [ ] Build TOOL_REGISTRY array
- [ ] Implement helper functions
- [ ] Test tool lookup

---

#### 2.2 Update Agent Configuration
**File**: `src/store/index.ts`

**Add to AgentConfig**:
```typescript
selectedTools: string[] // Array of tool IDs
```

**Update**:
- Default orchestrator config
- Default subagent config
- Migration for existing agents

**Actions**:
- [ ] Add selectedTools field
- [ ] Set defaults (getDefaultTools())
- [ ] Update create/update functions
- [ ] Test persistence

---

#### 2.3 Update Agent Service
**File**: `src/services/agent-service.ts`

**Modify**:
- `executeWithStreaming` - Use selected tools
- `executeWithoutStreaming` - Use selected tools
- Build dynamic tool set per agent

**Actions**:
- [ ] Import buildToolSet function
- [ ] Replace static tools with dynamic
- [ ] Keep agent tools for orchestrator
- [ ] Test with different tool selections

---

### Phase 3: Tool Selection UI (2-3 hours)

#### 3.1 Create Tool Selector Component
**File**: `src/components/AgentManagement/ToolSelector.tsx`

**Features**:
- Checkbox list of all tools
- Grouped by category
- Select all / deselect all per category
- Shows tool descriptions
- Updates on change

**Actions**:
- [ ] Create component
- [ ] Add category grouping
- [ ] Style with Tailwind
- [ ] Test interactions

---

#### 3.2 Add to Orchestrator UI
**File**: `src/components/AgentManagement/index.tsx`

**Integration**:
- Add ToolSelector to orchestrator form
- Wire up to updateOrchestrator
- Show selected tool count

**Actions**:
- [ ] Import ToolSelector
- [ ] Add to orchestrator section
- [ ] Wire up onChange
- [ ] Test selection updates

---

#### 3.3 Add to Create Agent Dialog
**File**: `src/components/AgentManagement/CreateAgentDialog.tsx`

**Integration**:
- Add ToolSelector to form
- Add to form state
- Include in submission

**Actions**:
- [ ] Add to form UI
- [ ] Add to state
- [ ] Update handleSubmit
- [ ] Test agent creation with tools

---

#### 3.4 Add to Edit Agent (if needed)
**File**: Create or modify agent edit dialog

**Actions**:
- [ ] Check if edit dialog exists
- [ ] Add ToolSelector if it does
- [ ] Test tool updates

---

### Phase 4: Polish & Testing (2 hours)

#### 4.1 Update Orchestrator Prompt
**File**: `src/services/orchestrator-prompt.ts`

**Changes**:
- Make prompt more generic
- Note that tools are user-selected
- Remove hardcoded tool list (or make it example)

**Actions**:
- [ ] Update intro section
- [ ] Add note about selected tools
- [ ] Keep tool documentation as reference

---

#### 4.2 Export Updates
**File**: `src/services/tools/index.ts`

**Actions**:
- [ ] Export tool-registry functions
- [ ] Keep legacy exports
- [ ] Update imports

---

#### 4.3 Comprehensive Testing

**Test Scenarios**:

1. **New Project with Context Tools**
   - [ ] Create project
   - [ ] Verify `.agent/` folder created
   - [ ] Verify README.md exists
   - [ ] User can see and open files

2. **Orchestrator with Context Tools**
   - [ ] Enable context tools
   - [ ] Ask to analyze and save
   - [ ] Verify write_context_note works
   - [ ] Verify files saved in `.agent/`

3. **Subagent with Limited Tools**
   - [ ] Create agent with only read_file
   - [ ] Try to delegate write operation
   - [ ] Verify tool restrictions work

4. **Tool Selection Persistence**
   - [ ] Configure tools
   - [ ] Close and reopen app
   - [ ] Verify selection persists

5. **Multi-Session Continuity**
   - [ ] Session 1: Save context
   - [ ] Close app
   - [ ] Session 2: Read context
   - [ ] Verify context preserved

6. **Tool Selection UI**
   - [ ] Select individual tools
   - [ ] Select all in category
   - [ ] Deselect all in category
   - [ ] Verify count updates

---

## Implementation Order

### Day 1 (6-7 hours)

**Morning** (3 hours):
1. ✅ Create context types
2. ✅ Implement context-manager.ts
3. ✅ Create context tools
4. ✅ Initialize in store

**Afternoon** (3-4 hours):
5. ✅ Create tool-registry.ts
6. ✅ Update AgentConfig interface
7. ✅ Update agent-service.ts
8. ✅ Test dynamic tool building

### Day 2 (4-5 hours)

**Morning** (2-3 hours):
9. ✅ Create ToolSelector component
10. ✅ Add to orchestrator UI
11. ✅ Add to create agent dialog

**Afternoon** (2 hours):
12. ✅ Update orchestrator prompt
13. ✅ Comprehensive testing
14. ✅ Bug fixes and polish

---

## Key Requirements Summary

### ✅ User Accessible `.agent/` Folder
- Created in project root
- User can see and open files
- Contains README explaining purpose
- All context notes visible

### ✅ Dynamic Tool Selection
- Not hardcoded to orchestrator
- Available to all agents (orchestrator + subagents)
- UI in agent configuration
- Shows tool name, description, category
- Checkbox selection
- Persists with agent config

### ✅ Tool Categories
1. **File Management** - read, write, create file/folder, list
2. **Context Management** - write note, read note, list notes, log progress
3. **Agent Tools** - Dynamic tools from subagents (orchestrator only)

---

## Success Criteria

✅ **Complete When**:
1. `.agent/` folder creates on project load
2. Users can see `.agent/` folder and files
3. 4 context tools work correctly
4. Tool registry populated with all tools
5. Agent config includes selectedTools
6. UI allows tool selection per agent
7. Agents only receive selected tools
8. Tool selection persists
9. Multi-session continuity works
10. All tests pass

---

## File Checklist

### New Files to Create:
- [ ] `src/types/context.ts`
- [ ] `src/services/context-manager.ts`
- [ ] `src/services/tools/context-tools.ts`
- [ ] `src/services/tools/tool-registry.ts`
- [ ] `src/components/AgentManagement/ToolSelector.tsx`

### Files to Modify:
- [ ] `src/services/tools/index.ts`
- [ ] `src/store/index.ts`
- [ ] `src/services/agent-service.ts`
- [ ] `src/services/orchestrator-prompt.ts`
- [ ] `src/components/AgentManagement/index.tsx`
- [ ] `src/components/AgentManagement/CreateAgentDialog.tsx`

### Files Auto-Created:
- `.agent/README.md` (explains folder)
- `.agent/architecture.md` (when first used)
- `.agent/progress.md` (when first used)
- `.agent/research.md` (when first used)
- `.agent/tasks.md` (when first used)
- `.agent/notes.md` (when first used)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Agent Management                                   │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  Orchestrator Config                         │ │ │
│  │  │  - Name, Model, API Key                      │ │ │
│  │  │  - System Prompt                             │ │ │
│  │  │  - ✅ Tool Selection (NEW)                   │ │ │
│  │  │    [✓] read_file                             │ │ │
│  │  │    [✓] write_file                            │ │ │
│  │  │    [✓] write_context_note                    │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  Subagent Config                             │ │ │
│  │  │  - ✅ Tool Selection (NEW)                   │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    Agent Service                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  executeWithStreaming(agent, messages)             │ │
│  │  1. Get agent.selectedTools                        │ │
│  │  2. buildToolSet(selectedTools)                    │ │
│  │  3. Add agent tools (for orchestrator)             │ │
│  │  4. Pass to streamText()                           │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    Tool Registry                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  TOOL_REGISTRY[]                                   │ │
│  │  - File Tools (5)                                  │ │
│  │  - Context Tools (4)                               │ │
│  │  - Future: Custom Tools                            │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  Tool Implementations                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ File Tools   │  │Context Tools │  │ Agent Tools  │  │
│  │ - read_file  │  │ - write_note │  │ - delegate   │  │
│  │ - write_file │  │ - read_note  │  │              │  │
│  │ - create_file│  │ - list_notes │  │              │  │
│  │ - list_files │  │ - log_prog   │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  File System / Storage                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │  project/                                          │ │
│  │  ├── .agent/               (✅ Visible to user)   │ │
│  │  │   ├── README.md                                │ │
│  │  │   ├── architecture.md                          │ │
│  │  │   ├── progress.md                              │ │
│  │  │   └── research.md                              │ │
│  │  ├── .manager-settings/                           │ │
│  │  ├── .manager-chat/                               │ │
│  │  └── src/                                         │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Risk Mitigation

### Risk 1: Tool Selection Complexity
**Risk**: Users confused by tool selection  
**Mitigation**: 
- Group by category
- Default to sensible selections
- Add descriptions
- Add help text

### Risk 2: Breaking Existing Agents
**Risk**: Existing agents stop working  
**Mitigation**:
- Auto-migrate to default tools
- Backwards compatibility
- Test with existing configs

### Risk 3: Performance Impact
**Risk**: Dynamic tool building is slow  
**Mitigation**:
- Build once per request
- Cache tool sets
- Profile and optimize

### Risk 4: User Confusion about .agent/
**Risk**: Users don't understand .agent/ folder  
**Mitigation**:
- Clear README.md
- Tooltips in UI
- Documentation
- Don't auto-hide folder

---

## Documentation Needs

1. **User Guide**: How to use context tools
2. **User Guide**: How to select tools for agents
3. **User Guide**: What is the .agent/ folder
4. **Developer Docs**: How to add new tools
5. **Developer Docs**: Tool registry structure

---

## Future Enhancements (Not in Scope)

1. Tool templates ("Research Agent", "Code Writer")
2. AI-suggested tools based on agent description
3. Tool usage analytics
4. Custom tool upload
5. Tool dependencies
6. Dynamic prompt generation based on tools
7. Tool search and filtering

---

## Timeline

**Week 1**:
- Day 1: Context management (3 hours)
- Day 2: Tool registry (4 hours)
- Day 3: UI components (3 hours)
- Day 4: Testing & polish (2 hours)

**Total**: 10-12 hours

---

## Next Steps

1. ✅ Review this plan
2. ✅ Confirm approach
3. ✅ Start with context management foundation
4. ✅ Then add dynamic tool selection
5. ✅ Test thoroughly
6. ✅ Deploy

**Ready to start implementation?** 🚀
