'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ChatContextValue {
  isChatOpen: boolean
  initialMessage: string | null
  openChat: (prefill?: string) => void
  closeChat: () => void
  consumeInitialMessage: () => string | null
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [initialMessage, setInitialMessage] = useState<string | null>(null)

  const openChat = useCallback((prefill?: string) => {
    if (prefill) setInitialMessage(prefill)
    setIsChatOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setIsChatOpen(false)
    setInitialMessage(null)
  }, [])

  const consumeInitialMessage = useCallback(() => {
    const msg = initialMessage
    setInitialMessage(null)
    return msg
  }, [initialMessage])

  return (
    <ChatContext.Provider
      value={{ isChatOpen, initialMessage, openChat, closeChat, consumeInitialMessage }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChatDrawer() {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChatDrawer must be used within ChatProvider')
  return context
}
