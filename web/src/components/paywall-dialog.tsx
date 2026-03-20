'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
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
  const { tier: currentTier } = useSub()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [loadingTier, setLoadingTier] = useState<string | null>(null)

  const handleSubscribe = async (tierKey: string) => {
    if (tierKey === currentTier) return

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
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <div className="space-y-6">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
            Unlock More with Steward
          </h2>
        </div>

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

                {/* Show button for paid tiers, or show downgrade on Free card when user is paid */}
                {t.key === 'free' && currentTier !== 'free' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isLoadingThis}
                    className="mt-4 w-full"
                    onClick={() => handleSubscribe('free')}
                  >
                    {isLoadingThis ? 'Loading...' : 'Downgrade to Free'}
                  </Button>
                )}
                {t.key === 'free' && currentTier === 'free' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled
                    className="mt-4 w-full"
                  >
                    Current Plan
                  </Button>
                )}
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
                        : tierRank(t.key) < tierRank(currentTier)
                          ? 'Downgrade'
                          : 'Subscribe'}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Dialog>
  )
}
