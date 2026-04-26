'use client'

/**
 * Platform Showcase — Client Component. Drives a 4-step animation
 * sequence (idle → phone notif → sync pulse → laptop notif → done)
 * triggered by IntersectionObserver, plus a 3-tagline rotation on
 * a 3s setInterval.
 *
 * Phase 10 server-shell refactor: extracted from landing-client-page.
 * Stays a client component because of the dual-animation state.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { S, APP_STORE_URL } from './tokens'

const PLATFORM_TAGLINES = [
  'Set it up on your phone',
  'Check it on your laptop',
  'Get alerts everywhere',
]

export function PlatformShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0) // 0=idle, 1=phone notif, 2=sync pulse, 3=laptop notif, 4=done
  const [tagIdx, setTagIdx] = useState(0)

  // Trigger the sync animation on scroll
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && step === 0) {
          const seq: Array<[number, number]> = [
            [400, 1],
            [1200, 2],
            [2000, 3],
            [2800, 4],
          ]
          seq.forEach(([delay, s]) => setTimeout(() => setStep(s), delay))
        }
      },
      { threshold: 0.3 },
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rotate taglines
  useEffect(() => {
    const iv = setInterval(() => setTagIdx((i) => (i + 1) % PLATFORM_TAGLINES.length), 3000)
    return () => clearInterval(iv)
  }, [])

  return (
    <section
      id="platforms"
      ref={sectionRef}
      style={{
        padding: 'clamp(80px,12vh,140px) clamp(24px,8vw,60px)',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 900px 700px at 50% 45%,rgba(42,92,69,0.35) 0%,transparent 60%)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto' }}>
        <div className="landing-reveal" style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto 60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.18)', borderRadius: 30, padding: '6px 16px', marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: S.mint }}>📱</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: S.mint }}>Now on iOS &amp; Web</span>
            <span style={{ fontSize: 13, color: S.mint }}>💻</span>
          </div>
          <h2 style={{ fontFamily: S.serif, fontSize: 'clamp(44px,6vw,88px)', fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.035em', color: S.cream, margin: 0, marginBottom: 16 }}>
            One account<br /><em className="italic-accent">Every screen</em>
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(247,246,243,0.5)', fontWeight: 300, maxWidth: 500, margin: '0 auto' }}>
            Create a watch on your phone. Manage it on your laptop. Alerts hit everywhere. Same account, perfectly synced.
          </p>
        </div>

        <div className="landing-reveal lnd-device-scene" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, maxWidth: 920, margin: '0 auto' }}>
          {/* iPhone */}
          <div className="lnd-phone-mockup" style={{
            width: 220, height: 440, flexShrink: 0,
            background: 'linear-gradient(145deg,#1a1a1a,#0a0a0a)',
            borderRadius: 36, padding: 8,
            border: '2px solid rgba(255,255,255,0.12)',
            boxShadow: '0 16px 28px rgba(0,0,0,0.45)',
            animation: 'platformFloatA 6s ease-in-out infinite',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 80, height: 22, background: '#000', borderRadius: 14, zIndex: 5 }} />
            <div style={{ width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden', background: '#0F2018', position: 'relative' }}>
              <div style={{ padding: '28px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(247,246,243,0.5)' }}>9:41</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  <div style={{ width: 12, height: 8, borderRadius: 2, background: 'rgba(247,246,243,0.4)' }} />
                  <div style={{ width: 16, height: 8, borderRadius: 2, background: 'rgba(110,231,183,0.6)' }} />
                </div>
              </div>
              <div style={{ padding: '6px 16px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#243D30,#0F2018)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: S.mint, fontWeight: 700 }}>S</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: S.cream, fontFamily: S.serif }}>Steward</span>
              </div>
              <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { emoji: '👟', name: 'Nike Dunk Low', price: '$89', badge: '↓ 26%', badgeColor: S.gold },
                  { emoji: '✈️', name: 'SFO → Tokyo', price: '$1,247', badge: 'Monitoring', badgeColor: S.mint },
                  { emoji: '🍽', name: 'Carbone NY', price: 'Fri 8pm', badge: 'Watching', badgeColor: S.mint },
                ].map((w, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 18 }}>{w.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: S.cream, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
                      <div style={{ fontSize: 9, color: 'rgba(247,246,243,0.4)' }}>{w.price}</div>
                    </div>
                    <span style={{ fontSize: 7.5, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: `${w.badgeColor}15`, border: `1px solid ${w.badgeColor}30`, color: w.badgeColor }}>{w.badge}</span>
                  </div>
                ))}
              </div>
              <div style={{
                position: 'absolute', top: 38, left: 10, right: 10,
                background: 'rgba(30,60,45,0.95)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(110,231,183,0.25)', borderRadius: 16, padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? 'translateY(0)' : 'translateY(-30px)',
                transition: 'all 0.5s cubic-bezier(.34,1.56,.64,1)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#243D30,#0F2018)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: S.mint, fontWeight: 800, flexShrink: 0 }}>S</div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: S.mint }}>🎉 Table found!</div>
                  <div style={{ fontSize: 8, color: 'rgba(247,246,243,0.6)', lineHeight: 1.3 }}>Carbone NY · Fri 8pm for 2</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sync connector */}
          <div className="lnd-sync-connector" style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', minWidth: 80, maxWidth: 220, alignSelf: 'center',
          }}>
            <div className="lnd-beam-track" style={{
              position: 'absolute', left: 0, right: 0, top: '28px', height: 2,
              background: step >= 2 ? `repeating-linear-gradient(90deg, ${S.mint}55 0, ${S.mint}55 3px, transparent 3px, transparent 8px)` : 'transparent',
              transition: 'background 0.4s 0.2s',
            }} />
            {step >= 2 && (
              <div className="lnd-pulse-track" style={{
                position: 'absolute', left: 0, right: 0, top: '28px', height: 2, overflow: 'visible', pointerEvents: 'none',
              }}>
                <div className="lnd-pulse-dot-pingpong" style={{
                  position: 'absolute', top: '50%', width: 10, height: 10, borderRadius: '50%',
                  background: S.mint, transform: 'translateY(-50%)',
                  boxShadow: `0 0 8px ${S.mint}, 0 0 16px ${S.mint}80`,
                  animation: 'beamPingPong 3s ease-in-out infinite',
                }} />
              </div>
            )}
            <div className="lnd-sync-orb" style={{
              width: 56, height: 56, borderRadius: '50%',
              background: step >= 2 ? 'radial-gradient(circle,rgba(110,231,183,0.25),rgba(110,231,183,0.05))' : 'rgba(110,231,183,0.05)',
              border: `2px solid ${step >= 2 ? 'rgba(110,231,183,0.4)' : 'rgba(110,231,183,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.6s ease', position: 'relative', zIndex: 2,
              boxShadow: step >= 2 ? '0 0 30px rgba(110,231,183,0.3), 0 0 60px rgba(110,231,183,0.1)' : 'none',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S.mint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: step >= 2 ? 1 : 0.3, transition: 'opacity 0.5s' }}>
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: step >= 2 ? S.mint : 'rgba(110,231,183,0.3)', transition: 'color 0.5s',
            }}>Synced</span>
          </div>

          {/* Laptop */}
          <div className="lnd-laptop-mockup" style={{
            width: 420, flexShrink: 0,
            animation: 'platformFloatB 6s ease-in-out infinite',
          }}>
            <div style={{
              background: 'linear-gradient(145deg,#111,#0a0a0a)',
              borderRadius: '12px 12px 0 0', padding: 6,
              border: '2px solid rgba(255,255,255,0.1)', borderBottom: 'none',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.4), 0 0 40px rgba(110,231,183,0.06)',
              position: 'relative',
            }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px 8px 0 0', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                    <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.7 }} />
                  ))}
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 10px', fontSize: 8.5, color: 'rgba(247,246,243,0.35)' }}>joinsteward.app/home</div>
              </div>
              <div style={{ background: '#0F2018', borderRadius: '0 0 6px 6px', padding: 14, minHeight: 240 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: 'linear-gradient(135deg,#243D30,#0F2018)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: S.mint, fontWeight: 800 }}>S</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: S.cream }}>Dashboard</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ fontSize: 7, padding: '3px 8px', borderRadius: 6, background: 'rgba(110,231,183,0.1)', color: S.mint, fontWeight: 600 }}>3 Active</div>
                    <div style={{ fontSize: 7, padding: '3px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: S.gold, fontWeight: 600 }}>1 Triggered</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { emoji: '👟', name: 'Nike Dunk Low', sub: 'nike.com', status: '$89 ↓26%', sColor: S.gold },
                    { emoji: '✈️', name: 'SFO → Tokyo', sub: 'flights', status: 'Monitoring', sColor: S.mint },
                    { emoji: '🍽', name: 'Carbone NY', sub: 'resy.com', status: 'Table found!', sColor: '#34d399' },
                  ].map((w, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 10, padding: '10px',
                      borderLeft: i === 2 ? '2px solid #34d399' : undefined,
                    }}>
                      <div style={{ fontSize: 16, marginBottom: 6 }}>{w.emoji}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: S.cream, marginBottom: 2 }}>{w.name}</div>
                      <div style={{ fontSize: 7.5, color: 'rgba(247,246,243,0.35)', marginBottom: 6 }}>{w.sub}</div>
                      <div style={{ fontSize: 7, fontWeight: 700, color: w.sColor }}>{w.status}</div>
                    </div>
                  ))}
                </div>
                <div style={{
                  position: 'absolute', bottom: 20, right: 20,
                  background: 'rgba(30,60,45,0.95)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(110,231,183,0.3)', borderRadius: 10, padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 8, maxWidth: 200,
                  opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'all 0.5s cubic-bezier(.34,1.56,.64,1)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                }}>
                  <span className="lnd-pulse-dot" />
                  <div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: S.mint }}>🎉 Table found!</div>
                    <div style={{ fontSize: 7, color: 'rgba(247,246,243,0.6)' }}>Carbone NY · Fri 8pm</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{
              height: 14, background: 'linear-gradient(180deg,#1a1a1a,#111)',
              borderRadius: '0 0 12px 12px / 0 0 8px 8px',
              border: '2px solid rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.04)',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 60, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }} />
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="landing-reveal" style={{ textAlign: 'center', marginTop: 48, minHeight: 36 }}>
          {PLATFORM_TAGLINES.map((tag, i) => (
            <div key={tag} style={{
              fontFamily: S.serif, fontSize: 22, fontWeight: 600, color: S.cream,
              position: i === tagIdx ? 'relative' : 'absolute',
              opacity: i === tagIdx ? 1 : 0, transform: i === tagIdx ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.5s ease', pointerEvents: i === tagIdx ? 'auto' : 'none',
              left: i === tagIdx ? undefined : 0, right: i === tagIdx ? undefined : 0,
            }}>
              {tag.split(' ').map((w, wi) => (
                <span key={wi} style={{ color: wi === tag.split(' ').length - 1 ? S.mint : S.cream }}>{w}{wi < tag.split(' ').length - 1 ? ' ' : ''}</span>
              ))}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="landing-reveal" style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 36, flexWrap: 'wrap' }}>
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="landing-btn-shimmer lnd-cta-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: S.mint, color: S.forest, fontSize: 15, fontWeight: 700, padding: '16px 32px', borderRadius: 14, textDecoration: 'none', transition: 'all .35s cubic-bezier(.34,1.56,.64,1)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            iOS App
          </a>
          <Link href="/signup"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.2)', color: S.mint, fontSize: 15, fontWeight: 700, padding: '16px 32px', borderRadius: 14, textDecoration: 'none', transition: 'all .35s' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Open Web App
          </Link>
        </div>

        {/* Micro features */}
        <div className="landing-reveal" style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 40, flexWrap: 'wrap' }}>
          {[
            { icon: '🔔', label: 'Push, Email & SMS alerts' },
            { icon: '⚡', label: 'Real-time sync' },
            { icon: '🔒', label: 'One account, all devices' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{f.icon}</span>
              <span style={{ fontSize: 13, color: 'rgba(247,246,243,0.45)', fontWeight: 400 }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
