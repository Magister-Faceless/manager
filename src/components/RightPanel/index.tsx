import { useState } from 'react'
import { Bot, MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatInterface } from '@/components/ChatInterface'
import { AgentManagement } from '@/components/AgentManagement'

type RightPanelView = 'chat' | 'settings'

export function RightPanel() {
  const [currentView, setCurrentView] = useState<RightPanelView>('chat')

  return (
    <div className="flex flex-col h-full">
      {/* Header with view toggle */}
      <div className="border-b p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentView === 'chat' ? (
            <>
              <MessageSquare className="h-5 w-5" />
              <h2 className="font-semibold">AI Chat</h2>
            </>
          ) : (
            <>
              <Bot className="h-5 w-5" />
              <h2 className="font-semibold">AI Settings</h2>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {currentView === 'chat' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('settings')}
            >
              <Bot className="h-4 w-4 mr-1" />
              Settings
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('chat')}
            >
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {currentView === 'chat' ? (
          <ChatInterface />
        ) : (
          <AgentManagement />
        )}
      </div>
    </div>
  )
}
