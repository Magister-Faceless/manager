import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, Plus, Trash2, MoreVertical, Loader2 } from 'lucide-react'
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

export function ChatInterface() {
  const {
    chatSessions,
    currentSession,
    createChatSession,
    selectChatSession,
    addMessage,
    deleteChatSession,
    orchestrator,
  } = useStore()
  
  const [input, setInput] = useState('')
  const [showSessions, setShowSessions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    // Check if orchestrator is configured
    if (!orchestrator || !orchestrator.provider || !orchestrator.model) {
      alert('Please configure the Orchestrator agent first!\n\nClick the "Show Agents" button in the top right to set up your agent.')
      return
    }

    if (!orchestrator.apiKey) {
      alert('Please add your OpenRouter API key in Agent Management!')
      return
    }

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message to chat
    addMessage({ role: 'user', content: userMessage })

    try {
      // Prepare conversation history
      const messages: CoreMessage[] = currentSession?.messages
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })) || []

      // Add current message
      messages.push({ role: 'user', content: userMessage })

      // Execute agent with streaming
      const result = await agentService.executeWithStreaming(orchestrator, messages)

      // Stream the response
      let fullResponse = ''
      let toolExecutionLog: string[] = []
      let currentStep = 0

      for await (const chunk of result.fullStream) {
        switch (chunk.type) {
          case 'tool-call':
            currentStep++
            console.log('🔧 Tool called:', chunk.toolName, 'with input:', chunk.input)
            const argsStr = JSON.stringify(chunk.input, null, 2)
            toolExecutionLog.push(`\n**🔧 Step ${currentStep} - Tool: ${chunk.toolName}**\n\`\`\`json\n${argsStr}\n\`\`\``)
            break
            
          case 'tool-result':
            console.log('✅ Tool result:', chunk.toolName, chunk.output)
            const resultStr = typeof chunk.output === 'string' 
              ? chunk.output 
              : JSON.stringify(chunk.output, null, 2)
            toolExecutionLog.push(`\n**✅ Result:**\n\`\`\`json\n${resultStr}\n\`\`\``)
            break
            
          case 'text-delta':
            fullResponse += chunk.text
            break
        }
      }

      // Add assistant response to chat
      let finalContent = ''
      
      // Add tool execution details if any
      if (toolExecutionLog.length > 0) {
        finalContent += '### Tool Executions\n' + toolExecutionLog.join('\n\n') + '\n\n---\n\n'
      }
      
      // Add the AI's text response
      if (fullResponse) {
        finalContent += fullResponse
      } else if (toolExecutionLog.length > 0) {
        finalContent += '_Task completed successfully._'
      } else {
        finalContent = 'Task completed.'
      }

      addMessage({ 
        role: 'assistant', 
        content: finalContent
      })

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
      
      addMessage({
        role: 'assistant',
        content: errorMessage
      })
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

  return (
    <div className="flex h-full">
      {/* Chat Sessions Sidebar */}
      <div
        className={`border-r transition-all duration-200 ${
          showSessions ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Chat History</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={createChatSession}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-60px)]">
          <div className="p-2 space-y-1">
            {chatSessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent group ${
                  currentSession?.id === session.id ? 'bg-accent' : ''
                }`}
                onClick={() => selectChatSession(session.id)}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm flex-1 truncate">{session.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChatSession(session.id)
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSessions(!showSessions)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold">
              {currentSession?.name || 'No Active Chat'}
            </h2>
          </div>
          {!currentSession && (
            <Button onClick={createChatSession} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {!currentSession ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No chat selected</p>
                <p className="text-sm mb-4">Create a new chat to get started</p>
                <Button onClick={createChatSession}>
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
            <div className="space-y-4 max-w-4xl mx-auto">
              {currentSession.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                      {message.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      ) : (
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
                      )}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {currentSession && (
          <div className="border-t p-4">
            <div className="flex gap-2 max-w-4xl mx-auto">
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
