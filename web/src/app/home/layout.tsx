'use client'

import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { ChatDrawer } from '@/components/chat-drawer'
import { LaunchAnimation } from '@/components/launch-animation'
import { ChatProvider, useChatDrawer } from '@/providers/chat-provider'

function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const { isChatOpen, openChat, closeChat } = useChatDrawer()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    // Check sessionStorage flag (email/password login & signup)
    const fromLogin = sessionStorage.getItem('steward_just_signed_in')
    // Check URL param (OAuth callback)
    const fromOAuth = searchParams.get('welcome') === '1'

    if (fromLogin || fromOAuth) {
      setShowAnimation(true)
      sessionStorage.removeItem('steward_just_signed_in')

      // Clean up the ?welcome param from the URL
      if (fromOAuth) {
        const url = new URL(window.location.href)
        url.searchParams.delete('welcome')
        router.replace(url.pathname, { scroll: false })
      }
    }
  }, [searchParams, router])

  return (
    <>
      {showAnimation && (
        <LaunchAnimation onComplete={() => setShowAnimation(false)} />
      )}

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
    </>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ChatProvider>
      <Suspense>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </Suspense>
    </ChatProvider>
  )
}
