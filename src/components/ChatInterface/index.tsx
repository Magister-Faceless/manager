import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, Plus, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useStore } from '@/store'
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
  } = useStore()
  
  const [input, setInput] = useState('')
  const [showSessions, setShowSessions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages])

  const handleSend = () => {
    if (!input.trim()) return

    // Add user message
    addMessage({
      role: 'user',
      content: input.trim(),
    })

    // Simulate AI response (in real app, this would call the AI API)
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: 'This is a simulated response. In the full implementation, this would call your configured AI agent.',
      })
    }, 500)

    setInput('')
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
        <ScrollArea className="flex-1 p-4">
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
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
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
        </ScrollArea>

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
              />
              <Button onClick={handleSend} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
