import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, Plus, Trash2, MoreVertical, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useStore } from '@/store'
import { agentService } from '@/services/agent-service'
import { CoreMessage } from 'ai'
import ReactMarkdown from 'react-markdown'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StreamingMessage } from './StreamingMessage'

export function ChatInterface() {
  const {
    chatSessions,
    currentSession,
    createChatSession,
    selectChatSession,
    addMessage,
    deleteChatSession,
    renameChatSession,
    orchestrator,
    subAgents,
    currentProject,
  } = useStore()
  
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editThreadName, setEditThreadName] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Streaming state
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingTools, setStreamingTools] = useState<Array<{
    step: number
    toolName: string
    input: any
    output?: any
    status: 'running' | 'success' | 'error'
  }>>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages, streamingContent, streamingTools])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    // Check if project is selected
    if (!currentProject) {
      alert('Please select a project first!')
      return
    }

    // Check if orchestrator is configured
    if (!orchestrator || !orchestrator.provider || !orchestrator.model) {
      alert('Please configure the Orchestrator agent first!\n\nClick the "Settings" button to set up your agent.')
      return
    }

    if (!orchestrator.apiKey) {
      alert('Please add your API key in AI Settings!')
      return
    }

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    setIsStreaming(true)
    setStreamingContent('')
    setStreamingTools([])

    // Add user message to chat
    await addMessage({ role: 'user', content: userMessage })

    try {
      // Prepare conversation history
      const messages: CoreMessage[] = currentSession?.messages
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })) || []

      // Add current message
      messages.push({ role: 'user', content: userMessage })

      // Execute agent with streaming, passing subAgents for dynamic tool generation
      const result = await agentService.executeWithStreaming(orchestrator, messages, subAgents)

      // Stream the response with real-time updates
      let fullResponse = ''
      let currentStep = 0
      const toolsMap = new Map<number, any>()

      for await (const chunk of result.fullStream) {
        switch (chunk.type) {
          case 'tool-call':
            currentStep++
            console.log('🔧 Tool called:', chunk.toolName, 'with input:', chunk.input)
            
            const newTool = {
              step: currentStep,
              toolName: chunk.toolName,
              input: chunk.input,
              status: 'running' as const
            }
            toolsMap.set(currentStep, newTool)
            setStreamingTools(Array.from(toolsMap.values()))
            break
            
          case 'tool-result':
            console.log('✅ Tool result:', chunk.toolName, chunk.output)
            
            // Find the corresponding tool call and update it
            for (const [step, tool] of toolsMap.entries()) {
              if (tool.toolName === chunk.toolName && !tool.output) {
                tool.output = chunk.output
                tool.status = 'success'
                toolsMap.set(step, tool)
                setStreamingTools(Array.from(toolsMap.values()))
                break
              }
            }
            break
            
          case 'text-delta':
            fullResponse += chunk.text
            setStreamingContent(fullResponse)
            break
        }
      }

      // Finalize streaming
      setIsStreaming(false)

      // Add assistant response to chat
      let finalContent = ''
      
      // Add tool execution details if any
      if (toolsMap.size > 0) {
        finalContent += '### Tool Executions\n'
        Array.from(toolsMap.values()).forEach(tool => {
          finalContent += `\n**🔧 Step ${tool.step} - Tool: ${tool.toolName}**\n`
          finalContent += `\`\`\`json\n${JSON.stringify(tool.input, null, 2)}\n\`\`\`\n`
          if (tool.output) {
            const outputStr = typeof tool.output === 'string' 
              ? tool.output 
              : JSON.stringify(tool.output, null, 2)
            finalContent += `\n**✅ Result:**\n\`\`\`json\n${outputStr}\n\`\`\`\n`
          }
        })
        finalContent += '\n---\n\n'
      }
      
      // Add the AI's text response
      if (fullResponse) {
        finalContent += fullResponse
      } else if (toolsMap.size > 0) {
        finalContent += '_Task completed successfully._'
      } else {
        finalContent = 'Task completed.'
      }

      await addMessage({ 
        role: 'assistant', 
        content: finalContent
      })
      
      // Clear streaming state
      setStreamingContent('')
      setStreamingTools([])

    } catch (error) {
      console.error('Error executing agent:', error)
      
      let errorMessage = 'An error occurred while processing your request.'
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = '❌ API Key Error: Please check your OpenRouter API key in Agent Management.'
        } else if (error.message.includes('not configured')) {
          errorMessage = '❌ Configuration Error: Please configure your agent in Agent Management.'
        } else {
          errorMessage = `❌ Error: ${error.message}`
        }
      }
      
      await addMessage({
        role: 'assistant',
        content: errorMessage
      })
      
      // Clear streaming state on error
      setIsStreaming(false)
      setStreamingContent('')
      setStreamingTools([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRenameThread = async (threadId: string) => {
    if (editThreadName.trim()) {
      try {
        await renameChatSession(threadId, editThreadName.trim())
        setEditingThreadId(null)
        setEditThreadName('')
      } catch (error) {
        console.error('Failed to rename thread:', error)
        alert('Failed to rename thread. Please try again.')
      }
    }
  }

  const handleCreateThread = async () => {
    if (!currentProject) {
      alert('Please select a project first!')
      return
    }
    try {
      await createChatSession()
    } catch (error) {
      console.error('Failed to create thread:', error)
      alert('Failed to create chat thread. Please try again.')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread Selector */}
      <div className="border-b p-3">
        <div className="flex items-center gap-2 mb-2">
          <select
            className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
            value={currentSession?.id || ''}
            onChange={(e) => e.target.value && selectChatSession(e.target.value)}
          >
            <option value="">Select a chat thread...</option>
            {chatSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name} ({session.messages.length} messages)
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateThread}
            disabled={!currentProject}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Thread Management */}
        {chatSessions.length > 0 && (
          <ScrollArea className="max-h-32">
            <div className="space-y-1">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center gap-2 p-2 rounded text-sm hover:bg-accent group ${
                    currentSession?.id === session.id ? 'bg-accent' : ''
                  }`}
                >
                  <MessageSquare className="h-3 w-3 flex-shrink-0" />
                  
                  {editingThreadId === session.id ? (
                    <Input
                      value={editThreadName}
                      onChange={(e) => setEditThreadName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameThread(session.id)
                        if (e.key === 'Escape') setEditingThreadId(null)
                      }}
                      onBlur={() => handleRenameThread(session.id)}
                      className="h-6 text-xs flex-1"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="flex-1 truncate cursor-pointer"
                      onClick={() => selectChatSession(session.id)}
                    >
                      {session.name}
                    </span>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingThreadId(session.id)
                          setEditThreadName(session.name)
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (confirm('Delete this chat thread?')) {
                            try {
                              await deleteChatSession(session.id)
                            } catch (error) {
                              console.error('Failed to delete:', error)
                              alert('Failed to delete thread.')
                            }
                          }
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {!currentProject ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No project selected</p>
                <p className="text-sm">Select a project to start chatting</p>
              </div>
            </div>
          ) : !currentSession ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No chat selected</p>
                <p className="text-sm mb-4">Create a new chat to get started</p>
                <Button onClick={handleCreateThread}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>
            </div>
          ) : currentSession.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Start a conversation</p>
                <p className="text-sm">Type a message below to begin</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentSession.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'user' ? (
                    <div className="rounded-lg px-4 py-3 max-w-[80%] bg-primary text-primary-foreground break-words">
                      <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg px-4 py-3 max-w-[80%] bg-secondary text-secondary-foreground break-words overflow-hidden">
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none break-words">
                        <ReactMarkdown
                          components={{
                            code: ({ className, children, ...props }) => {
                              const isInline = !className?.includes('language-')
                              return isInline ? (
                                <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs" {...props}>
                                  {children}
                                </code>
                              ) : (
                                <code className="block bg-black/5 dark:bg-white/5 p-2 rounded text-xs overflow-x-auto" {...props}>
                                  {children}
                                </code>
                              )
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Show streaming message */}
              {isStreaming && (
                <StreamingMessage
                  content={streamingContent}
                  toolExecutions={streamingTools}
                  isStreaming={true}
                  timestamp={Date.now()}
                />
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        {currentSession && currentProject && (
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={isLoading}
              />
              <Button onClick={handleSend} size="icon" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
