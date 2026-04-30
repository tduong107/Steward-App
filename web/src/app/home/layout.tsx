'use client'

import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { ChatDrawer } from '@/components/chat-drawer'
import { CommandPalette } from '@/components/command-palette'
import { LaunchAnimation } from '@/components/launch-animation'
import { PaywallDialog } from '@/components/paywall-dialog'
import { AuthProvider } from '@/providers/auth-provider'
import { SubscriptionProvider } from '@/providers/subscription-provider'
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
    openChat()
  }, [openChat])

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
        <Sidebar onChatOpen={() => openChat()} />

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
  // PERF: AuthProvider + SubscriptionProvider used to live in the
  // root layout (`app/layout.tsx`), which meant every public
  // marketing route (/, /about, /blog/*, /privacy, /terms, /support,
  // /signup, /login, /forgot-password) shipped `@supabase/supabase-js`
  // (~80 KiB) and the supabase/ssr cookie helpers despite never
  // consuming the auth context. PageSpeed (Apr 30 2026) flagged 454
  // KiB of unused JavaScript on the landing page and a 33s
  // main-thread budget under throttling — most of which traced back
  // here. Moving the providers into this dashboard layout means:
  //   - Marketing routes never bundle the supabase client.
  //   - /(auth)/login + /(auth)/signup + /(auth)/forgot-password
  //     create their own supabase clients locally (they don't read
  //     the AuthContext), so they're unaffected.
  //   - /home/* (the only routes using `useAuth()` per a repo-wide
  //     grep) still get the providers via this nested layout.
  // ChatProvider stays nested inside because it's also dashboard-only.
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <ChatProvider>
          <Suspense>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
          </Suspense>
        </ChatProvider>
      </SubscriptionProvider>
    </AuthProvider>
  )
}
