# 🚀 Quick Start - Test Your AI Agent NOW!

## ⚡ 3-Minute Setup

### 1. Start App (30 seconds)
```bash
npm run dev
```
Open: http://localhost:5173

### 2. Configure Agent (1 minute)
1. Click **"Show Agents"** button (top right)
2. **OpenRouter** is already selected
3. Enter API Key: Get from https://openrouter.ai/keys
4. Select Model: `openai/gpt-4-turbo` or `anthropic/claude-3-sonnet`
5. Click **"Save Configuration"**

### 3. Create Project (30 seconds)
1. Click **"New Project"**
2. Select any folder
3. Grant permission

### 4. Test! (1 minute)
Type in chat:
```
"What files are in my project?"
```

## 🎯 Test Commands (Copy & Paste)

```
Create a file called test.md with content "Hello World"

Read test.md

Create a folder called docs

Create a file called docs/notes.md with content "# My Notes"

List all files including subfolders

Update test.md to say "Hello from AI!"
```

## ✅ What Should Happen

- Agent reads/creates/updates files instantly
- Files appear in file explorer immediately
- Files are actually created on your disk
- Console shows tool usage logs
- Responses stream in real-time

## 🔍 Verify It Works

1. Check file explorer - new files should appear
2. Open files in a text editor - content should match
3. Check browser console - should see "🔧 Tool called:" logs
4. Try complex command: "Create a project structure with 3 folders"

## ❌ If Something Fails

**"Please configure Orchestrator"**
→ Go to Agent Management, add API key

**"API key required"**
→ Enter your OpenRouter API key (starts with `sk-or-...`)

**"File not found"**
→ Ask agent: "What files do I have?" first

**Model not loading**
→ Check API key, try "Retry Loading Models"

## 🎓 What You Built

✅ AI agent that manages files autonomously  
✅ 5 working tools (read, write, create file/folder, list)  
✅ OpenRouter integration with streaming  
✅ Real local file operations  
✅ Multi-step task execution  

## 📊 Success = All These Work

- [ ] "What files are in my project?" → Lists files
- [ ] "Create a file called hello.txt" → File created
- [ ] "Read hello.txt" → Shows content
- [ ] "Create a folder called test" → Folder created
- [ ] Multi-step: "Create a folder called 'docs', then create a file inside it called readme.md"

## 🎉 Next Steps

**Week 1 Complete?** → Move to Week 2:
- Add search tools (grep, find)
- Add delete/rename/move
- Multi-agent collaboration

**Issues?** → Check `WEEK1_TESTING_GUIDE.md`

---

**Ready? Start testing!** ⚡
