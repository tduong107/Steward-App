'use client'

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { ChatDrawer } from '@/components/chat-drawer'
import { LaunchAnimation } from '@/components/launch-animation'
import { PaywallDialog } from '@/components/paywall-dialog'
import { ChatProvider, useChatDrawer } from '@/providers/chat-provider'

function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const { isChatOpen, openChat, closeChat } = useChatDrawer()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showAnimation, setShowAnimation] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const checkedRef = useRef(false)

  useEffect(() => {
    // Only check once on initial mount — not on every navigation
    if (checkedRef.current) return
    checkedRef.current = true

    // If we already showed the animation this session, skip entirely
    if (sessionStorage.getItem('steward_animation_shown')) return

    // Check sessionStorage flag (email/password login & signup)
    const fromLogin = sessionStorage.getItem('steward_just_signed_in')
    // Check URL param (OAuth callback)
    const fromOAuth = searchParams.get('welcome') === '1'

    if (fromLogin || fromOAuth) {
      setShowAnimation(true)
      sessionStorage.removeItem('steward_just_signed_in')
      // Mark that we've already shown the animation this session
      sessionStorage.setItem('steward_animation_shown', '1')

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
        <div className="flex-1 min-w-0 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          {/* Mobile header */}
          <Header onChatOpen={openChat} onTierBadgeClick={() => setShowPaywall(true)} />

          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
            <div className="mx-auto max-w-3xl w-full">{children}</div>
          </main>
        </div>

        {/* Chat drawer overlay */}
        <ChatDrawer open={isChatOpen} onClose={closeChat} />
      </div>

      {/* Paywall dialog (opened from mobile header tier badge) */}
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
