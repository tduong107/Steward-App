'use client'

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import type { SubscriptionTier } from '@/lib/types'

interface SubscriptionContextValue {
  tier: SubscriptionTier
  refreshTier: () => void
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  // Read tier directly from profile (synced via Supabase for both iOS & web)
  const tier: SubscriptionTier = profile?.subscription_tier ?? 'free'
  // Bump state to force re-render after profile refresh
  const [, setTick] = useState(0)
  const refreshTier = useCallback(() => setTick((t) => t + 1), [])

  return (
    <SubscriptionContext.Provider value={{ tier, refreshTier }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSub(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSub must be used within SubscriptionProvider')
  }
  return context
}
