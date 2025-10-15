# Week 1 Implementation - Testing Guide

## ✅ What Has Been Implemented

### 1. Tools Created (5 tools)
- ✅ **read_file** - Read contents of any file in the project
- ✅ **write_file** - Update/modify existing file contents
- ✅ **create_file** - Create new files with optional content
- ✅ **create_folder** - Create new folders/directories
- ✅ **list_files** - List files and folders (with recursive option)

### 2. Agent Service
- ✅ OpenRouter integration configured
- ✅ Streaming support for real-time responses
- ✅ Tool execution framework
- ✅ Error handling and logging

### 3. UI Updates
- ✅ Chat interface integrated with agent service
- ✅ Loading states and error messages
- ✅ Tool usage tracking
- ✅ OpenRouter set as default provider
- ✅ Default system prompts for all agents

## 🚀 Getting Started

### Step 1: Configure Orchestrator Agent

1. **Start the app**: `npm run dev`
2. **Open Agent Management**: Click "Show Agents" button (top right)
3. **Configure Orchestrator**:
   - Provider: Already set to **OpenRouter** (default)
   - API Key: Enter your OpenRouter API key
   - Model: Select a model (e.g., `openai/gpt-4-turbo`, `anthropic/claude-3-sonnet`)
   - System Prompt: Default prompt is already loaded
   - Click **"Save Configuration"**

### Step 2: Create a Test Project

1. Click "New Project"
2. Select a folder on your computer
3. Grant browser permissions
4. Create project

### Step 3: Create Some Test Files

Use the file explorer to create a few test files:
- Click the file icon
- Create `test.txt` with some content
- Create `notes.md` with some markdown
- Create a folder called "docs"

## 📋 Test Cases

### Test 1: Basic File Reading ✅

**Command**: "Read the contents of test.txt"

**Expected Behavior**:
1. Agent uses `read_file` tool
2. Returns file contents
3. Shows tool usage indicator

**What to verify**:
- File content is displayed correctly
- Response includes actual file content
- No errors in console

---

### Test 2: File Creation ✅

**Command**: "Create a file called hello.md with the content 'Hello World!'"

**Expected Behavior**:
1. Agent uses `create_file` tool
2. File appears in file explorer
3. File is created on disk

**What to verify**:
- New file appears in file explorer
- File contains correct content
- Can open and view the file

---

### Test 3: List Files ✅

**Command**: "What files are in my project?"

**Expected Behavior**:
1. Agent uses `list_files` tool
2. Returns list of all files and folders
3. Shows file types (file/folder)

**What to verify**:
- All files are listed
- Folders are identified correctly
- Response is formatted nicely

---

### Test 4: Update File Content ✅

**Command**: "Update test.txt to say 'This is updated content'"

**Expected Behavior**:
1. Agent uses `write_file` tool
2. File content is updated
3. Confirmation message

**What to verify**:
- File content is updated on disk
- Can view updated content
- No errors

---

### Test 5: Create Folder ✅

**Command**: "Create a folder called 'resources'"

**Expected Behavior**:
1. Agent uses `create_folder` tool
2. Folder appears in file explorer
3. Folder is created on disk

**What to verify**:
- Folder appears in file explorer
- Can create files inside it
- Folder exists on disk

---

### Test 6: Multi-Step Operation ✅

**Command**: "Create a folder called 'summaries', then create a file inside it called summary.md that lists all the files in my project"

**Expected Behavior**:
1. Agent uses `create_folder` tool
2. Agent uses `list_files` tool
3. Agent uses `create_file` tool
4. File contains list of files

**What to verify**:
- Folder is created
- File is created inside folder
- File contains correct list
- All tools executed in sequence

---

### Test 7: Recursive File Listing ✅

**Command**: "List all files including those in subfolders"

**Expected Behavior**:
1. Agent uses `list_files` with recursive=true
2. Shows all files in all subdirectories

**What to verify**:
- Files in subdirectories are included
- Folder structure is clear
- All files are found

---

## 🐛 Common Issues & Solutions

### Issue: "Please configure the Orchestrator agent"

**Solution**: 
- Go to Agent Management
- Configure provider, API key, and model
- Save configuration

### Issue: "API key is required"

**Solution**:
- Make sure you entered your OpenRouter API key
- Key should start with `sk-or-...`
- Get key from: https://openrouter.ai/keys

### Issue: "File not found"

**Solution**:
- Make sure you're using the correct file path
- Try listing files first: "What files do I have?"
- Path should be relative to project root

### Issue: "Model not loading"

**Solution**:
- Check your API key is valid
- Check internet connection
- Try clicking "Retry Loading Models"
- OpenRouter may be experiencing issues

### Issue: Tools not executing

**Solution**:
- Check browser console for errors
- Make sure project is selected
- Verify file system permissions
- Try refreshing the page

## 📊 Verification Checklist

After testing, verify:

- [ ] Can read files successfully
- [ ] Can create new files
- [ ] Can update existing files
- [ ] Can create folders
- [ ] Can list files (recursive and non-recursive)
- [ ] Multi-step operations work
- [ ] Tools are logged in console
- [ ] Streaming responses work
- [ ] Error messages are helpful
- [ ] OpenRouter models load correctly

## 🎯 Example Test Session

Here's a complete test session you can try:

```
You: "Create a folder called test-project"
Agent: Creates folder

You: "Create a file called README.md in test-project with content '# My Test Project'"
Agent: Creates file with content

You: "What files are in test-project?"
Agent: Lists files (should show README.md)

You: "Read README.md from test-project"
Agent: Shows file content

You: "Update test-project/README.md to add a description section"
Agent: Updates file with new content
```

## 📝 Logging & Debugging

Check browser console for:
- `🔧 Tool called:` - Shows which tools are being used
- `✅ Tool result:` - Shows tool execution results
- Any error messages

Enable verbose logging:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Watch for tool execution logs

## 🔍 What to Look For

### Good Signs ✅
- Files created appear in file explorer immediately
- File contents are accurate
- Tools execute in correct order
- Error messages are clear
- No console errors

### Warning Signs ⚠️
- Long delays before response
- Tools not executing
- Empty responses
- Console errors
- Files not appearing

## 🎓 Next Steps

Once Week 1 tests pass:

1. **Week 2**: Add more tools (search, grep, project structure)
2. **Week 3**: Multi-agent collaboration
3. **Week 4**: Advanced features and optimization

## 💡 Tips

1. **Start simple**: Test basic file read before complex operations
2. **Check console**: Always check browser console for errors
3. **Be specific**: Use exact file paths in commands
4. **Use natural language**: The agent understands conversational commands
5. **Test incrementally**: Test each tool individually before combining

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify API key is valid
3. Try with different models
4. Check file system permissions
5. Restart the dev server

## 🎉 Success Criteria

Week 1 is complete when:
- ✅ All 5 tools work correctly
- ✅ Agent can execute multi-step operations
- ✅ Files are created/modified on disk
- ✅ Error handling works properly
- ✅ OpenRouter integration is stable

Happy testing! 🚀
