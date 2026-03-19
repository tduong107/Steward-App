'use client'

import type { ReactNode } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { ChatDrawer } from '@/components/chat-drawer'
import { ChatProvider, useChatDrawer } from '@/providers/chat-provider'

function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const { isChatOpen, openChat, closeChat } = useChatDrawer()

  return (
    <div className="flex min-h-dvh bg-[var(--color-bg)]">
      {/* Desktop sidebar */}
      <Sidebar onChatOpen={openChat} />

      {/* Main column */}
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        {/* Mobile header */}
        <Header onChatOpen={openChat} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-3xl w-full">{children}</div>
        </main>
      </div>

      {/* Chat drawer overlay */}
      <ChatDrawer open={isChatOpen} onClose={closeChat} />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ChatProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </ChatProvider>
  )
}
