'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, SendHorizontal, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChat } from '@/hooks/use-chat'
import { useWatches } from '@/hooks/use-watches'
import { ChatMessage } from '@/components/chat-message'
import type { Watch } from '@/lib/types'

interface ChatDrawerProps {
  open: boolean
  onClose: () => void
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-[var(--color-bg-deep)] px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-ink-light)] [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-ink-light)] [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-ink-light)] [animation-delay:300ms]" />
      </div>
    </div>
  )
}

export function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const { messages, sendMessage, isLoading, clearMessages, addMessage } = useChat()
  const { createWatch } = useWatches()
  const [input, setInput] = useState('')
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mount/unmount with animation
  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
    } else {
      setVisible(false)
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Focus input when drawer opens
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [visible])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    sendMessage(text)
  }, [input, isLoading, sendMessage])

  const handleSuggestionClick = useCallback(
    (text: string) => {
      if (isLoading) return
      sendMessage(text)
    },
    [isLoading, sendMessage],
  )

  const handleCreateWatch = useCallback(
    async (data: Partial<Watch>) => {
      try {
        const created = await createWatch(data)
        addMessage({
          id: crypto.randomUUID(),
          role: 'steward',
          text: `Done! I created "${created.name || data.name || 'your watch'}". I'll start monitoring it right away and notify you when conditions are met.`,
          suggestions: ['Create another watch', 'Show my watches'],
        })
      } catch (err) {
        console.error('Failed to create watch from chat:', err)
        addMessage({
          id: crypto.randomUUID(),
          role: 'steward',
          text: 'Sorry, I had trouble creating that watch. Please try again.',
        })
      }
    },
    [createWatch, addMessage],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Panel — right on desktop, bottom on mobile */}
      <div
        className={cn(
          'absolute flex flex-col bg-[var(--color-bg)] transition-transform duration-300 ease-out',
          // Desktop: slide from right
          'md:right-0 md:top-0 md:h-full md:w-96 md:border-l md:border-[var(--color-border)]',
          visible ? 'md:translate-x-0' : 'md:translate-x-full',
          // Mobile: slide from bottom
          'max-md:inset-x-0 max-md:bottom-0 max-md:h-[85vh] max-md:rounded-t-[var(--radius-xl)]',
          visible ? 'max-md:translate-y-0' : 'max-md:translate-y-full',
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
            Ask Steward
          </h2>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearMessages}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-light)] hover:bg-[var(--color-bg-deep)] hover:text-[var(--color-ink)] transition-colors"
                aria-label="New chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-light)] hover:bg-[var(--color-bg-deep)] hover:text-[var(--color-ink)] transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center max-w-xs">
                <p className="text-3xl">🏠</p>
                <p className="mt-3 text-base font-semibold text-[var(--color-ink)]">
                  Hi, I&apos;m Steward
                </p>
                <p className="mt-1 text-sm text-[var(--color-ink-mid)]">
                  Tell me what you want to watch and I&apos;ll set it up for you.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  {[
                    'Watch a product price for me',
                    'Alert me when tickets go on sale',
                    'Track a flight price',
                    'Monitor a website for changes',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 text-sm text-[var(--color-ink-mid)] transition-colors hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onSuggestionClick={handleSuggestionClick}
              onCreateWatch={handleCreateWatch}
            />
          ))}

          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Steward..."
              className="flex-1 rounded-full bg-[var(--color-bg-deep)] px-4 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-light)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                input.trim() && !isLoading
                  ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-mid)]'
                  : 'bg-[var(--color-bg-deep)] text-[var(--color-ink-light)]',
              )}
              aria-label="Send message"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
