'use client'

/**
 * FAQ section — Client Component because of the open-accordion state.
 * The answer payload is static, defined here.
 *
 * Phase 10 server-shell refactor: kept as 'use client' rather than
 * splitting into a server shell + client island per item — every
 * accordion needs the same toggle handler with shared "only one open
 * at a time" semantics, which would mean lifting state to a parent
 * client wrapper anyway. Net cost is one tiny client island that owns
 * the whole list.
 */

import { useState } from 'react'
import { EyebrowPill } from '@/components/landing-fx/eyebrow-pill'
import { S } from './tokens'

const FAQ_ITEMS = [
  {
    q: 'What is Steward?',
    a: 'Steward is an AI-powered personal concierge app that monitors websites for price drops, restocks, restaurant reservation openings, campsite availability, flight fare changes, and event ticket restocks. Available on iOS and web.',
  },
  {
    q: 'How does Steward track prices?',
    a: 'Steward uses a multi-tier system combining direct website fetching, smart scraping, shopping APIs, and AI analysis to check prices across Amazon, Nike, Best Buy, Target, Walmart, and thousands of other retailers — up to every 2 hours on Premium.',
  },
  {
    q: 'Is Steward free?',
    a: 'Yes! The free plan includes up to 3 trackers with daily checks and push notifications. Upgrade to Pro ($4.99/mo) for 7 trackers and 12-hour checks, or Premium ($9.99/mo) for 15 trackers, 2-hour checks, and automated actions.',
  },
  {
    q: 'What websites does Steward work with?',
    a: 'Steward works with virtually any website — Amazon, Nike, Best Buy, Target, Walmart, Costco, Nordstrom for shopping; Resy and OpenTable for restaurants; Recreation.gov for campsites (Yosemite, Yellowstone, Big Sur); Google Flights and Kayak for flights; and Ticketmaster for events.',
  },
  {
    q: 'How is Steward different from Honey or CamelCamelCamel?',
    a: 'Unlike Honey (coupon-only) or CamelCamelCamel (Amazon-only), Steward works on any URL — from sneaker drops on Nike to campsite cancellations on Recreation.gov to restaurant reservations on Resy. It also uses AI to understand any page you share, so there are no browser extensions to install.',
  },
  {
    q: 'Can Steward help me get restaurant reservations?',
    a: 'Yes! Steward monitors Resy and OpenTable for reservation cancellations and new openings. When a table at your desired restaurant, date, time, and party size opens up, Steward sends you an instant alert so you can book it before anyone else.',
  },
  {
    q: 'Does Steward work on iPhone?',
    a: 'Yes — Steward has a native iOS app available on the App Store with push notifications, AI chat for creating watches, and a share extension so you can send any URL directly from Safari or any app. Your watches sync in real-time between iOS and the web dashboard.',
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section
      id="faq"
      style={{
        padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)',
        background: 'transparent',
        position: 'relative',
      }}
    >
      <div className="landing-reveal" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ marginBottom: 16 }}>
            <EyebrowPill>FAQ</EyebrowPill>
          </div>
          <h2
            style={{
              fontFamily: S.serif,
              fontSize: 'clamp(44px,6vw,88px)',
              fontWeight: 700,
              lineHeight: 0.96,
              letterSpacing: '-0.035em',
              color: S.cream,
              margin: 0,
            }}
          >
            Frequently Asked Questions
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={i} style={{ borderBottom: `1px solid ${S.border}` }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600, color: S.cream, paddingRight: 16 }}>
                    {item.q}
                  </span>
                  <span
                    style={{
                      fontSize: 20,
                      color: S.mint,
                      flexShrink: 0,
                      transition: 'transform 0.3s',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}
                  >
                    +
                  </span>
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? 300 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.35s ease, opacity 0.3s ease',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <p
                    style={{
                      fontSize: 14.5,
                      lineHeight: 1.7,
                      color: S.textDim,
                      fontWeight: 300,
                      padding: '0 0 20px',
                      margin: 0,
                    }}
                  >
                    {item.a}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
