'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { SubscriptionTier } from '@/lib/types'

interface SubscriptionContextValue {
  tier: SubscriptionTier
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // Stripe integration will come later — default to free tier
  const value: SubscriptionContextValue = { tier: 'free' }

  return (
    <SubscriptionContext.Provider value={value}>
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
