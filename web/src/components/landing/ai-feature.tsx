'use client'

/**
 * AI Concierge feature section (S/03) — Client Component.
 *
 * Drives a 3-step chat-message reveal animation cycling on a 2.8s
 * setInterval, gated by IntersectionObserver so the timer only ticks
 * when the section is visible. Reduced-motion users see the static
 * end state immediately.
 *
 * Phase 10 server-shell refactor: extracted from landing-client-page.
 * This is a client component because of the step state + interval +
 * observer; the static markup unfortunately has to come along for the
 * ride, but ChatBubble is a Server Component (in landing/helpers) so
 * its markup is small.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import { EyebrowPill } from '@/components/landing-fx/eyebrow-pill'
import { Magnetic } from '@/components/landing-fx/magnetic'
import { Bento } from '@/components/landing-fx/bento'
import { ChatBubble } from './helpers'
import { S } from './tokens'

type AiStep = 0 | 1 | 2 | 3

export function AIFeature() {
  const ref = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<AiStep>(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let timer: ReturnType<typeof setInterval> | null = null
    let visible = false

    const start = () => {
      if (reduced) {
        setStep(3)
        return
      }
      if (timer) return
      setStep(1)
      let s: AiStep = 1
      timer = setInterval(() => {
        s = s === 3 ? 0 : ((s + 1) as AiStep)
        setStep(s)
      }, 2800)
    }
    const stop = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        const isIn = entry.isIntersecting
        if (isIn && !visible) {
          visible = true
          start()
        } else if (!isIn && visible) {
          visible = false
          stop()
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      stop()
    }
  }, [])

  return (
    <section
      style={{
        padding: 'clamp(60px,10vh,120px) clamp(24px,8vw,60px)',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, transparent 0%, rgba(15,32,24,0.30) 45%, rgba(15,32,24,0.30) 55%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        className="lnd-feature-grid lnd-feature-reverse"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 80,
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ── Left column: Chat panel ─────────────────────────────── */}
        <div className="landing-reveal" ref={ref}>
          <Bento
            className="s03-bento"
            style={
              {
                background: 'var(--forest-2, #0F1410)',
                borderRadius: 24,
                border: '1px solid rgba(110,231,183,0.15)',
                padding: 24,
                boxShadow:
                  '0 32px 80px rgba(0,0,0,0.55), inset 0 0 80px rgba(110,231,183,0.04)',
                color: S.cream,
                position: 'relative',
                overflow: 'hidden',
              } as React.CSSProperties
            }
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                paddingBottom: 18,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 18,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  background:
                    'linear-gradient(135deg, var(--mint-2, #A7F3D0), var(--green-mid, #3A7C5A))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: S.serif,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--deep, #0F2018)',
                  flexShrink: 0,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
                }}
              >
                ✦
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: S.serif,
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--ink, #fff)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.1,
                  }}
                >
                  Steward
                </div>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'rgba(110,231,183,0.75)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--mint, #6EE7B7)',
                      animation: 'pulse 2s ease-in-out infinite',
                      display: 'inline-block',
                    }}
                  />
                  ✦ AI concierge
                </div>
              </div>
              <span
                aria-hidden="true"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(110,231,183,0.55)',
                  border: '1px solid rgba(110,231,183,0.22)',
                  padding: '3px 8px',
                  borderRadius: 6,
                }}
              >
                Live
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                minHeight: 260,
              }}
            >
              <ChatBubble visible={step >= 1} role="user">
                find me a table at carbone for fri at 8 for 2 ppl
              </ChatBubble>

              <ChatBubble visible={step >= 2} role="ai" tag="✦ Creating watch…">
                Got it. I&apos;ll watch Resy every 2 hrs for{' '}
                <strong style={{ color: 'var(--mint, #6EE7B7)', fontWeight: 600 }}>
                  Carbone NY · Fri 8pm · party of 2
                </strong>
                .
              </ChatBubble>

              <ChatBubble visible={step >= 3} role="ai" tag="✦ Watch live">
                <span style={{ color: 'var(--mint, #6EE7B7)', fontWeight: 600 }}>✓ Done.</span>{' '}
                You&apos;ll get a push the moment a table opens.
              </ChatBubble>
            </div>

            <div
              style={{
                marginTop: 18,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  flex: 1,
                  paddingLeft: 12,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.42)',
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {step >= 3 ? 'Track another…' : 'Tell me what to find'}
              </span>
              <button
                type="button"
                aria-label="Attach a screenshot"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(110,231,183,0.10)',
                  border: '1px solid rgba(110,231,183,0.22)',
                  color: 'var(--mint, #6EE7B7)',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '7px 11px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >
                <span aria-hidden="true">📷</span> Screenshot
              </button>
              <button
                type="button"
                aria-label="Send"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background:
                    'linear-gradient(180deg, var(--mint, #6EE7B7) 0%, var(--green, #2A5C45) 100%)',
                  color: 'var(--deep, #0F2018)',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '8px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                  boxShadow:
                    '0 2px 8px rgba(110,231,183,0.25), inset 0 1px 0 rgba(255,255,255,0.4)',
                }}
              >
                Send <span aria-hidden="true">→</span>
              </button>
            </div>
          </Bento>
        </div>

        {/* ── Right column: copy ──────────────────────────────────── */}
        <div className="landing-reveal lnd-ai-text">
          <div style={{ marginBottom: 20 }}>
            <EyebrowPill icon="✦">AI Concierge</EyebrowPill>
          </div>

          <h2
            style={{
              fontFamily: S.serif,
              fontSize: 'clamp(40px, 5.8vw, 84px)',
              fontWeight: 700,
              lineHeight: 0.96,
              letterSpacing: '-0.035em',
              color: 'var(--ink, #fff)',
              margin: 0,
              marginBottom: 22,
            }}
          >
            No forms.<br />Just say<br />what you <em className="italic-accent">want</em>
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
              fontSize: 17,
              lineHeight: 1.6,
              color: 'var(--ink-60, rgba(255,255,255,0.62))',
              fontWeight: 300,
              marginBottom: 32,
              maxWidth: 500,
            }}
          >
            Skip the dropdowns and filters. Tell Steward what you want via text or a screenshot.
            The AI finds the product or experience and sets up tracking in seconds. It even
            detects fake deals.
          </p>

          <Magnetic strength={0.3}>
            <Link
              href="/signup"
              onClick={() => track('signup_button_click', { location: 'ai_feature' })}
              className="btn-primary"
            >
              Try the AI concierge <span aria-hidden="true">→</span>
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  )
}
