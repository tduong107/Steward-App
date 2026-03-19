'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface ChatContextValue {
  isChatOpen: boolean
  openChat: () => void
  closeChat: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        openChat: () => setIsChatOpen(true),
        closeChat: () => setIsChatOpen(false),
      }}
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
