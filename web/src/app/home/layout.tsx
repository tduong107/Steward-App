'use client'

import { useState, type ReactNode } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { ChatDrawer } from '@/components/chat-drawer'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isChatOpen, setChatOpen] = useState(false)

  return (
    <div className="flex min-h-dvh bg-[var(--color-bg)]">
      {/* Desktop sidebar */}
      <Sidebar onChatOpen={() => setChatOpen(true)} />

      {/* Main column */}
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        {/* Mobile header */}
        <Header onChatOpen={() => setChatOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-3xl w-full">{children}</div>
        </main>
      </div>

      {/* Chat drawer overlay */}
      <ChatDrawer open={isChatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
