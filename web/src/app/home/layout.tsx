'use client'

import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { ChatDrawer } from '@/components/chat-drawer'
import { CommandPalette } from '@/components/command-palette'
import { LaunchAnimation } from '@/components/launch-animation'
import { PaywallDialog } from '@/components/paywall-dialog'
import { ChatProvider, useChatDrawer } from '@/providers/chat-provider'
import { useWatches } from '@/hooks/use-watches'

function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const { isChatOpen, openChat, closeChat } = useChatDrawer()
  const { watches } = useWatches()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showAnimation, setShowAnimation] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const checkedRef = useRef(false)

  const triggeredCount = watches.filter(w => w.triggered && w.status !== 'deleted').length

  // ⌘K global shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleNewWatch = useCallback(() => {
    setCmdOpen(true)
  }, [])

  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true

    if (sessionStorage.getItem('steward_animation_shown')) return

    const fromLogin = sessionStorage.getItem('steward_just_signed_in')
    const fromOAuth = searchParams.get('welcome') === '1'

    if (fromLogin || fromOAuth) {
      setShowAnimation(true)
      sessionStorage.removeItem('steward_just_signed_in')
      sessionStorage.setItem('steward_animation_shown', '1')

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

      <div className="flex h-dvh overflow-hidden bg-[var(--color-bg)]" style={{ fontFamily: 'var(--font-body)' }}>
        {/* Sidebar */}
        <Sidebar onChatOpen={() => setCmdOpen(true)} />

        {/* Main content area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <Topbar
            onNewWatch={handleNewWatch}
            triggeredCount={triggeredCount}
          />

          {/* Content scroll area */}
          <div className="flex-1 overflow-hidden flex">
            <main className="flex-1 overflow-y-auto dashboard-scroll px-4 py-6 md:px-8 md:py-7">
              {children}
            </main>
          </div>
        </div>

        {/* Chat drawer overlay */}
        <ChatDrawer open={isChatOpen} onClose={closeChat} />
      </div>

      {/* Command palette (⌘K) */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      <PaywallDialog open={showPaywall} onClose={() => setShowPaywall(false)} />
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
