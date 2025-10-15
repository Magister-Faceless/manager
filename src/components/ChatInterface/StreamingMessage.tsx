/**
 * Streaming Message Component
 * 
 * Displays AI messages with real-time streaming and tool execution visualization
 */

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface ToolExecution {
  step: number
  toolName: string
  input: any
  output?: any
  status: 'running' | 'success' | 'error'
}

interface StreamingMessageProps {
  content: string
  toolExecutions: ToolExecution[]
  isStreaming: boolean
  timestamp: number
}

export function StreamingMessage({ 
  content, 
  toolExecutions, 
  isStreaming,
  timestamp 
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('')
  
  // Simulate streaming effect for content
  useEffect(() => {
    if (isStreaming && content.length > displayedContent.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, displayedContent.length + 1))
      }, 10)
      return () => clearTimeout(timer)
    } else if (!isStreaming) {
      setDisplayedContent(content)
    }
  }, [content, displayedContent, isStreaming])

  return (
    <div className="flex justify-start">
      <div className="rounded-lg px-4 py-3 max-w-[80%] bg-secondary text-secondary-foreground break-words overflow-hidden">
        {/* Tool Executions */}
        {toolExecutions.length > 0 && (
          <div className="mb-3 space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              🔧 Tool Executions
            </div>
            {toolExecutions.map((tool) => (
              <div
                key={tool.step}
                className="border border-border rounded-md p-2 bg-background/50"
              >
                <div className="flex items-center gap-2 mb-1">
                  {tool.status === 'running' && (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                  {tool.status === 'success' && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                  {tool.status === 'error' && (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-xs font-medium">
                    Step {tool.step}: {tool.toolName}
                  </span>
                </div>
                
                {/* Tool Input */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Input
                  </summary>
                  <pre className="mt-1 p-2 bg-black/5 dark:bg-white/5 rounded text-[10px] overflow-x-auto">
                    {JSON.stringify(tool.input, null, 2)}
                  </pre>
                </details>
                
                {/* Tool Output */}
                {tool.output && (
                  <details className="text-xs mt-1">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Output
                    </summary>
                    <pre className="mt-1 p-2 bg-black/5 dark:bg-white/5 rounded text-[10px] overflow-x-auto">
                      {typeof tool.output === 'string' 
                        ? tool.output 
                        : JSON.stringify(tool.output, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message Content */}
        {(displayedContent || isStreaming) && (
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
              {displayedContent}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1 h-4 bg-current animate-pulse ml-0.5" />
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs opacity-70 mt-2">
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
