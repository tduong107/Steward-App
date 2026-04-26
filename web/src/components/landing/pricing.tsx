'use client'

/**
 * Pricing section — Client Component because of the monthly/yearly
 * toggle state. Plan data is static, defined here.
 *
 * Phase 10 server-shell refactor: kept as 'use client' rather than
 * doing the server-shell + client-toggle split — the toggle state
 * affects every plan card's price + button label, so cleanly slicing
 * the markup into a static shell + a small client island would
 * require lifting all the per-plan rendering into the client. Net
 * marginal — the savings don't justify the complexity for this size.
 */

import { useState } from 'react'
import Link from 'next/link'
import { EyebrowPill } from '@/components/landing-fx/eyebrow-pill'
import { Magnetic } from '@/components/landing-fx/magnetic'
import { S } from './tokens'

type Plan = {
  name: string
  monthly: string
  yearly: string
  periodMonthly: string
  periodYearly: string
  featured: boolean
  tag?: string
  features: string[]
  btnMonthly: string
  btnYearly: string
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    monthly: '$0',
    yearly: '$0',
    periodMonthly: '/ forever',
    periodYearly: '/ forever',
    featured: false,
    features: ['Up to 3 trackers', 'Checks once per day', 'Push notifications', 'AI chat setup'],
    btnMonthly: 'Get Started for Free',
    btnYearly: 'Get Started for Free',
  },
  {
    name: 'Steward Pro',
    monthly: '$4.99',
    yearly: '$39.99',
    periodMonthly: '/ month',
    periodYearly: '/ year',
    featured: false,
    features: [
      'Up to 7 trackers',
      'Check every 12 hours',
      'Smart Cart Links',
      'Price insights & deal alerts',
      'Email & SMS alerts',
    ],
    btnMonthly: 'Subscribe for $4.99/mo',
    btnYearly: 'Subscribe for $39.99/yr',
  },
  {
    name: 'Steward Premium',
    monthly: '$9.99',
    yearly: '$79.99',
    periodMonthly: '/ month',
    periodYearly: '/ year',
    featured: true,
    tag: 'BEST VALUE',
    features: [
      'Up to 15 trackers',
      'Check every 2 hours',
      'Steward Acts for you',
      'Everything in Pro',
      'Fake deal detection',
      'Priority support',
    ],
    btnMonthly: 'Subscribe for $9.99/mo',
    btnYearly: 'Subscribe for $79.99/yr',
  },
]

export function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <section
      id="pricing"
      style={{
        padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)',
        background: 'transparent',
        position: 'relative',
      }}
    >
      <div className="landing-reveal" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 40px' }}>
        <div style={{ marginBottom: 16 }}>
          <EyebrowPill>Pricing</EyebrowPill>
        </div>
        <h2 style={{ fontFamily: S.serif, fontSize: 'clamp(44px,6vw,88px)', fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.035em', color: S.cream, margin: 0, marginBottom: 16 }}>
          Pays for itself<br />with <em className="italic-accent">one deal</em>
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(247,246,243,0.5)', fontWeight: 300 }}>
          Start free, upgrade when you see how much you save.
        </p>
      </div>

      <div className="landing-reveal" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 48 }}>
        <span style={{ fontSize: 14, fontWeight: !yearly ? 600 : 400, color: !yearly ? S.cream : 'rgba(247,246,243,0.4)', transition: 'all .3s' }}>Monthly</span>
        <button
          onClick={() => setYearly((v) => !v)}
          aria-label={yearly ? 'Switch to monthly billing' : 'Switch to yearly billing'}
          style={{
            width: 52, height: 28, borderRadius: 14, padding: 3,
            background: yearly ? S.mint : 'rgba(255,255,255,0.12)',
            border: 'none', cursor: 'pointer', position: 'relative',
            transition: 'background .3s', fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: yearly ? S.forest : 'rgba(247,246,243,0.8)',
            transform: yearly ? 'translateX(24px)' : 'translateX(0)',
            transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
          }} />
        </button>
        <span style={{ fontSize: 14, fontWeight: yearly ? 600 : 400, color: yearly ? S.cream : 'rgba(247,246,243,0.4)', transition: 'all .3s' }}>
          Yearly
          <span style={{ fontSize: 11, fontWeight: 700, color: S.gold, marginLeft: 6 }}>Save 33%</span>
        </span>
      </div>

      <div className="lnd-pricing-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {PLANS.map((plan, i) => (
          <div key={plan.name} className="landing-reveal"
            style={{
              background: plan.featured
                ? 'linear-gradient(135deg, rgba(110,231,183,0.18), rgba(42,92,69,0.35))'
                : S.cardBg,
              border: plan.featured ? '1px solid rgba(110,231,183,0.35)' : S.border,
              borderRadius: 24, padding: '36px 28px', position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              animationDelay: `${i * 100}ms`,
              boxShadow: plan.featured
                ? '0 12px 28px rgba(110,231,183,0.14), inset 0 1px 0 rgba(255,255,255,0.08)'
                : 'none',
            }}>
            {plan.tag && (
              <div style={{
                position: 'absolute', top: 16, right: 16,
                background: 'linear-gradient(135deg, var(--mint, #6EE7B7), var(--green-mid, #3A7C5A))',
                color: 'var(--deep, #0F2018)',
                fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                padding: '4px 11px', borderRadius: 20,
                boxShadow: '0 4px 14px rgba(110,231,183,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
              }}>{plan.tag}</div>
            )}
            <div style={{ fontFamily: S.serif, fontSize: 22, fontWeight: 700, color: S.cream, marginBottom: 8 }}>{plan.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
              <span style={{ fontFamily: S.serif, fontSize: 38, fontWeight: 700, color: S.mint }}>{yearly ? plan.yearly : plan.monthly}</span>
              <span style={{ fontSize: 13, color: 'rgba(247,246,243,0.4)' }}>{yearly ? plan.periodYearly : plan.periodMonthly}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {plan.features.map(f => (
                <li key={f} style={{ fontSize: 13, color: 'rgba(247,246,243,0.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: S.mint, fontSize: 12, fontWeight: 700 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Magnetic strength={0.2} style={{ marginTop: 'auto', display: 'flex' }}>
              <Link href="/signup" style={{
                display: 'block', textAlign: 'center', padding: 14, borderRadius: 12,
                fontSize: 14, fontWeight: plan.featured ? 700 : 600,
                textDecoration: 'none', transition: 'all .3s',
                width: '100%',
                background: plan.featured
                  ? 'linear-gradient(180deg, var(--mint, #6EE7B7) 0%, var(--green, #2A5C45) 100%)'
                  : 'rgba(110,231,183,0.06)',
                border: plan.featured ? 'none' : '1px solid rgba(110,231,183,0.18)',
                color: plan.featured ? 'var(--deep, #0F2018)' : 'var(--mint, #6EE7B7)',
                boxShadow: plan.featured
                  ? '0 2px 10px rgba(110,231,183,0.25), inset 0 1px 0 rgba(255,255,255,0.4)'
                  : 'none',
              }}>{yearly ? plan.btnYearly : plan.btnMonthly}</Link>
            </Magnetic>
          </div>
        ))}
      </div>
    </section>
  )
}
