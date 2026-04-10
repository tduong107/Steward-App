'use client'

import { useEffect, useState } from 'react'
import { Check, Apple } from 'lucide-react'
import posthog from 'posthog-js'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useSub } from '@/hooks/use-subscription'
import { cn } from '@/lib/utils'

interface PaywallDialogProps {
  open: boolean
  onClose: () => void
}

interface TierConfig {
  name: string
  key: string
  monthlyPrice: string
  yearlyPrice: string
  features: string[]
}

function tierRank(key: string): number {
  if (key === 'premium') return 2
  if (key === 'pro') return 1
  return 0
}

const tiers: TierConfig[] = [
  {
    name: 'Free',
    key: 'free',
    monthlyPrice: '$0',
    yearlyPrice: '$0',
    features: ['3 watches', 'Daily checks', 'Notify only'],
  },
  {
    name: 'Pro',
    key: 'pro',
    monthlyPrice: '$4.99',
    yearlyPrice: '$39.99',
    features: ['7 watches', 'Every 12h checks', 'Quick Links', 'Price insights'],
  },
  {
    name: 'Premium',
    key: 'premium',
    monthlyPrice: '$9.99',
    yearlyPrice: '$79.99',
    features: ['15 watches', 'Every 2h checks', 'Steward Acts', 'Auto-actions'],
  },
]

export function PaywallDialog({ open, onClose }: PaywallDialogProps) {
  const { tier: currentTier, source } = useSub()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [appleMessage, setAppleMessage] = useState(false)

  const isAppleSub = source === 'apple'

  useEffect(() => {
    if (open) {
      posthog.capture('paywall_viewed', { current_tier: currentTier })
    }
  }, [open, currentTier])

  const handleSubscribe = async (tierKey: string) => {
    if (tierKey === currentTier) return

    // Apple subscribers can't change plan through web
    if (isAppleSub) {
      setAppleMessage(true)
      return
    }

    // Downgrade to free = open Stripe portal to cancel subscription
    if (tierKey === 'free') {
      setLoadingTier('free')
      try {
        const res = await fetch('/api/stripe/portal', { method: 'POST' })
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        } else if (data.error) {
          alert(data.error)
        }
      } catch (err) {
        console.error('Failed to open portal:', err)
      } finally {
        setLoadingTier(null)
      }
      return
    }

    setLoadingTier(tierKey)
    posthog.capture('subscription_upgrade_started', { tier: tierKey, billing, current_tier: currentTier })
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierKey, billing }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Failed to start checkout:', err)
    } finally {
      setLoadingTier(null)
    }
  }

  return (
    <Dialog open={open} onClose={() => { onClose(); setAppleMessage(false) }} className="max-w-2xl">
      <div className="space-y-6">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
            {currentTier === 'free' ? 'Unlock More with Steward' : 'Your Steward Plan'}
          </h2>
        </div>

        {/* Apple subscription banner */}
        {isAppleSub && appleMessage && (
          <div className="rounded-[var(--radius-md)] bg-blue-500/10 border border-blue-500/20 p-3.5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <Apple size={14} className="text-blue-500" />
              <span className="text-xs font-semibold text-blue-500">Managed via App Store</span>
            </div>
            <p className="text-[11px] text-blue-400 leading-relaxed">
              Your subscription is managed through Apple. To change or cancel your plan, go to
              <span className="font-semibold"> Settings → Apple ID → Subscriptions</span> on your iPhone.
            </p>
          </div>
        )}

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-1">
          <div className="inline-flex rounded-full bg-[var(--color-bg-deep)] p-1">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                billing === 'monthly'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-ink)] shadow-sm'
                  : 'text-[var(--color-ink-mid)]',
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling('yearly')}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                billing === 'yearly'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-ink)] shadow-sm'
                  : 'text-[var(--color-ink-mid)]',
              )}
            >
              Yearly
            </button>
          </div>
          {billing === 'yearly' && (
            <span className="ml-2 rounded-full bg-[var(--color-green-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-green)]">
              Save 33%
            </span>
          )}
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {tiers.map((t) => {
            const isCurrent = t.key === currentTier
            const price = billing === 'monthly' ? t.monthlyPrice : t.yearlyPrice
            const isLoadingThis = loadingTier === t.key
            const isDowngrade = tierRank(t.key) < tierRank(currentTier)

            return (
              <div
                key={t.key}
                className={cn(
                  'relative flex flex-col rounded-[var(--radius-lg)] border p-4',
                  isCurrent
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-card)]',
                )}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-accent)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Current
                  </span>
                )}

                <h3 className="text-sm font-semibold text-[var(--color-ink)]">{t.name}</h3>

                <div className="mt-2">
                  <span className="text-2xl font-bold text-[var(--color-ink)]">{price}</span>
                  {t.key !== 'free' && (
                    <span className="text-sm text-[var(--color-ink-mid)]">
                      {billing === 'yearly' ? '/yr' : '/mo'}
                    </span>
                  )}
                </div>

                <ul className="mt-4 flex-1 space-y-2">
                  {t.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />
                      <span className="text-xs text-[var(--color-ink-mid)]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Free card */}
                {t.key === 'free' && isCurrent && (
                  <div className="mt-4 text-center">
                    <span className="text-[11px] font-medium text-[var(--color-ink-light)]">Current Plan</span>
                  </div>
                )}
                {t.key === 'free' && !isCurrent && (
                  <button
                    type="button"
                    disabled={isLoadingThis}
                    onClick={() => handleSubscribe('free')}
                    className="mt-4 w-full text-center text-[11px] text-[var(--color-ink-light)] underline underline-offset-2 hover:text-[var(--color-ink-mid)] transition-colors disabled:opacity-50"
                  >
                    {isLoadingThis ? 'Loading...' : 'Switch to Free'}
                  </button>
                )}

                {/* Paid tier cards */}
                {t.key !== 'free' && (
                  <Button
                    size="sm"
                    variant={isCurrent ? 'secondary' : 'default'}
                    disabled={isCurrent || isLoadingThis}
                    className="mt-4 w-full"
                    onClick={() => handleSubscribe(t.key)}
                  >
                    {isCurrent
                      ? 'Current Plan'
                      : isLoadingThis
                        ? 'Loading...'
                        : isDowngrade
                          ? 'Downgrade'
                          : 'Subscribe'}
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {/* Source indicator for paid users */}
        {currentTier !== 'free' && (
          <p className="text-center text-[11px] text-[var(--color-ink-light)]">
            {isAppleSub
              ? 'Subscription managed via App Store'
              : source === 'stripe'
                ? 'Subscription managed via Stripe'
                : 'Subscription active'}
          </p>
        )}
      </div>
    </Dialog>
  )
}
