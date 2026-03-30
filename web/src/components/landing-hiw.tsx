'use client'

import { useEffect, useRef, useState } from 'react'

// ── data ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    title: 'Spot something you want',
    body: 'Browsing Nike? Checking flights? Eyeing a restaurant on Resy? Steward works from any app or browser you already use. No need to switch.',
    features: ['🧭 Safari', '🌐 Chrome', '🛍 Any app'],
    screen: 1,
  },
  {
    title: 'Tap Share, pick Steward',
    body: 'Hit the share button in any app, then tap Steward. The AI reads the page, finds the product, and asks what you want to track. Done in seconds.',
    features: ['📤 iOS Share Sheet', '✦ AI auto-detects', '⚡ 5 seconds'],
    screen: 2,
  },
  {
    title: 'Get pinged when it changes',
    body: 'Steward monitors around the clock. Price drop? Push notification with a link to buy. Table opened? Tap to book. You\'ll never miss a deal again.',
    features: ['🔔 Push notifications', '🔗 Direct links', '24/7 Monitoring'],
    screen: 3,
  },
]

// ── Phone screens ─────────────────────────────────────────────────────────────
function Screen1() {
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '44px 16px 16px', display: 'flex', flexDirection: 'column', opacity: 1, transition: 'all .6s cubic-bezier(.4,0,.2,1)' }}>
      {/* Browser mockup */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)'].map((c, i) => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c, display: 'block' }} />
            ))}
          </div>
          <div style={{ flex: 1, fontSize: 9, color: 'rgba(247,246,243,0.4)', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 8px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            🔒 nike.com/dunk-low-panda
          </div>
          <span style={{ fontSize: 14, color: '#6EE7B7', animation: 'sharePulse 2s ease-in-out infinite' }}>↗</span>
        </div>
        <div style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>👟</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F7F6F3', marginBottom: 4 }}>Nike Dunk Low Panda</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F7F6F3', marginBottom: 10 }}>$120.00</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#1a1a1a', border: '2px solid rgba(255,255,255,0.1)', display: 'block' }} />
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#f5f5f5', border: '2px solid #6EE7B7', display: 'block' }} />
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#8B4513', border: '2px solid rgba(255,255,255,0.1)', display: 'block' }} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 8, fontSize: 11, fontWeight: 600, color: 'rgba(247,246,243,0.5)' }}>Add to Cart</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', marginTop: 'auto', paddingTop: 10 }}>
        {['🧭 Safari', '🌐 Chrome', '🛒 Amazon', '✈️ Google'].map((label, i) => (
          <span key={i} style={{ fontSize: 9.5, padding: '4px 9px', borderRadius: 20, background: i === 0 ? 'rgba(110,231,183,0.08)' : 'rgba(255,255,255,0.03)', border: i === 0 ? '1px solid rgba(110,231,183,0.18)' : '1px solid rgba(255,255,255,0.06)', color: i === 0 ? '#6EE7B7' : 'rgba(247,246,243,0.4)' }}>{label}</span>
        ))}
      </div>
    </div>
  )
}

function Screen2({ active }: { active: boolean }) {
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '44px 16px 16px', display: 'flex', flexDirection: 'column', opacity: active ? 1 : 0, transform: active ? 'scale(1)' : 'scale(0.96)', transition: 'all .6s cubic-bezier(.4,0,.2,1)', pointerEvents: active ? 'auto' : 'none' }}>
      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 14, marginBottom: 'auto', opacity: 0.5 }}>
        <div style={{ fontSize: 11, color: 'rgba(247,246,243,0.3)', textAlign: 'center' }}>👟 Nike Dunk Low...</div>
      </div>
      {/* Share sheet */}
      <div style={{ background: 'rgba(30,50,40,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px 20px 0 0', padding: '14px 14px 18px', margin: '0 -16px -16px', transform: active ? 'translateY(0)' : 'translateY(20px)', opacity: active ? 1 : 0, transition: 'all .5s .2s cubic-bezier(.34,1.56,.64,1)' }}>
        <div style={{ width: 36, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(247,246,243,0.35)', marginBottom: 10 }}>Share via</div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 14 }}>
          {[
            { icon: '💬', label: 'Messages', bg: '#34C759' },
            { icon: '✉️', label: 'Mail', bg: '#007AFF' },
            { icon: '✦', label: 'Steward', bg: '#2A5C45', isApp: true },
            { icon: '📋', label: 'Copy', bg: '#555' },
          ].map((app) => (
            <div key={app.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: app.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, ...(app.isApp ? { border: '2px solid #6EE7B7', boxShadow: '0 0 16px rgba(110,231,183,0.4)' } : {}) }}>
                {app.icon}
              </div>
              <div style={{ fontSize: 8.5, color: app.isApp ? '#6EE7B7' : 'rgba(247,246,243,0.45)', fontWeight: app.isApp ? 600 : 400 }}>{app.label}</div>
            </div>
          ))}
        </div>
        {/* AI result */}
        <div style={{ background: 'linear-gradient(135deg,rgba(42,92,69,0.4),rgba(15,32,24,0.3))', border: '1px solid rgba(110,231,183,0.2)', borderRadius: 14, padding: 12, transform: active ? 'translateY(0)' : 'translateY(10px)', opacity: active ? 1 : 0, transition: 'all .5s .6s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ color: '#6EE7B7', fontSize: 12 }}>✦</span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6EE7B7' }}>AI detected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>👟</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#F7F6F3' }}>Nike Dunk Low Panda</div>
              <div style={{ fontSize: 10, color: 'rgba(247,246,243,0.4)' }}>$120.00 · nike.com</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            {['📉 Alert below $90', '📦 Restock alert', '📊 Any change'].map((opt, i) => (
              <div key={opt} style={{ fontSize: 10, color: i === 0 ? '#6EE7B7' : 'rgba(247,246,243,0.5)', padding: '6px 10px', borderRadius: 10, background: i === 0 ? 'rgba(110,231,183,0.08)' : 'rgba(255,255,255,0.03)', border: i === 0 ? '1px solid rgba(110,231,183,0.2)' : '1px solid rgba(255,255,255,0.06)', fontWeight: i === 0 ? 600 : 400 }}>{opt}</div>
            ))}
          </div>
          <div style={{ background: '#6EE7B7', color: '#0F2018', fontSize: 12, fontWeight: 700, textAlign: 'center', padding: 10, borderRadius: 10, transform: active ? 'scale(1)' : 'scale(0.95)', opacity: active ? 1 : 0, transition: 'all .4s .9s ease' }}>
            Start Tracking →
          </div>
        </div>
      </div>
    </div>
  )
}

function Screen3({ active }: { active: boolean }) {
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '44px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12, opacity: active ? 1 : 0, transform: active ? 'scale(1)' : 'scale(0.96)', transition: 'all .6s cubic-bezier(.4,0,.2,1)', pointerEvents: active ? 'auto' : 'none' }}>
      {/* Push notification */}
      <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 10, transform: active ? 'translateY(0)' : 'translateY(-30px)', opacity: active ? 1 : 0, transition: 'all .6s .3s cubic-bezier(.34,1.56,.64,1)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,rgba(42,92,69,0.6),rgba(28,61,46,0.4))', border: '1px solid rgba(110,231,183,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✦</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6EE7B7', marginBottom: 2 }}>Steward</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#F7F6F3', marginBottom: 2 }}>Price dropped! 🎉</div>
          <div style={{ fontSize: 10.5, color: 'rgba(247,246,243,0.55)', lineHeight: 1.35 }}>Nike Dunk Low Panda is now $89</div>
        </div>
        <div style={{ fontSize: 9, color: 'rgba(247,246,243,0.3)', flexShrink: 0 }}>now</div>
      </div>
      {/* Deal card */}
      <div style={{ background: 'linear-gradient(135deg,rgba(42,92,69,0.45),rgba(15,32,24,0.3))', border: '1px solid rgba(110,231,183,0.2)', borderRadius: 18, padding: 18, position: 'relative', overflow: 'hidden', transform: active ? 'translateY(0)' : 'translateY(20px)', opacity: active ? 1 : 0, transition: 'all .5s .6s ease' }}>
        <div style={{ position: 'absolute', top: 14, right: 14, background: '#F59E0B', color: '#0F2018', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>SAVE 26%</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>👟</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#F7F6F3' }}>Nike Dunk Low Panda</div>
            <div style={{ fontSize: 10, color: 'rgba(247,246,243,0.4)' }}>nike.com</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: 'rgba(247,246,243,0.3)', textDecoration: 'line-through' }}>$120</span>
          <span style={{ fontSize: 32, fontWeight: 700, color: '#6EE7B7', fontFamily: 'Georgia, serif' }}>$89</span>
        </div>
        <div style={{ display: 'block', textAlign: 'center', background: '#6EE7B7', color: '#0F2018', fontSize: 13, fontWeight: 700, padding: 12, borderRadius: 12, transform: active ? 'translateY(0)' : 'translateY(10px)', opacity: active ? 1 : 0, transition: 'all .4s .9s ease' }}>
          Buy Now →
        </div>
      </div>
      {/* Savings row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', transform: active ? 'translateY(0)' : 'translateY(10px)', opacity: active ? 1 : 0, transition: 'all .4s 1.1s ease' }}>
        <span style={{ fontSize: 14 }}>💰</span>
        <span style={{ fontSize: 11, color: 'rgba(247,246,243,0.5)' }}>You just saved <strong style={{ color: '#6EE7B7' }}>$31</strong></span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function LandingHIW() {
  const [activeStep, setActiveStep] = useState(0)
  const [clickLocked, setClickLocked] = useState(false)
  const [progress, setProgress] = useState(0)
  // JS-sticky state: 'before' | 'fixed' | 'after'
  const [phoneMode, setPhoneMode] = useState<'before' | 'fixed' | 'after'>('before')
  const [phoneRight, setPhoneRight] = useState(0)
  const stepRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)]
  const phoneRef = useRef<HTMLDivElement>(null)
  const phoneColRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clickLockedRef = useRef(false)
  useEffect(() => { clickLockedRef.current = clickLocked }, [clickLocked])

  useEffect(() => {
    const STICKY_TOP = 120
    const PHONE_H = 620 // phone + dots + padding

    let ticking = false

    function update() {
      if (!sectionRef.current || !phoneColRef.current) return

      const sec = sectionRef.current.getBoundingClientRect()
      const col = phoneColRef.current.getBoundingClientRect()
      const right = window.innerWidth - col.right

      if (sec.top > STICKY_TOP) {
        setPhoneMode('before')
      } else if (sec.bottom < STICKY_TOP + PHONE_H) {
        setPhoneMode('after')
      } else {
        setPhoneMode('fixed')
        setPhoneRight(right)
      }

      // Step tracking
      if (!clickLockedRef.current) {
        const target = window.innerHeight * 0.45
        let best = 0, bestDist = Infinity
        stepRefs.forEach((ref, i) => {
          if (!ref.current) return
          const { top, height } = ref.current.getBoundingClientRect()
          const dist = Math.abs(top + height / 2 - target)
          if (dist < bestDist) { bestDist = dist; best = i }
        })
        setActiveStep(best)
        setProgress((best / 2) * 100)
      }
      ticking = false
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', update)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function advancePhone() {
    const next = activeStep >= 2 ? 0 : activeStep + 1
    setActiveStep(next)
    setProgress((next / 2) * 100)
    setClickLocked(true)
    if (lockTimer.current) clearTimeout(lockTimer.current)
    lockTimer.current = setTimeout(() => setClickLocked(false), 3000)
  }

  return (
    <section ref={sectionRef} id="how-it-works" style={{ position: 'relative', background: 'linear-gradient(180deg,#080A08 0%,rgba(15,32,24,0.15) 30%,rgba(15,32,24,0.15) 70%,#080A08 100%)' }}>
      {/* Header */}
      <div className="landing-reveal" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto', padding: '120px 60px 60px' }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6EE7B7', opacity: 0.7, marginBottom: 16 }}>How it works</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px,5vw,48px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#F7F6F3', marginBottom: 16 }}>
          Effortless savings<br />in <em style={{ fontStyle: 'italic', color: '#6EE7B7' }}>three steps</em>
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(247,246,243,0.5)', fontWeight: 300 }}>Set up in 30 seconds. Here&apos;s how.</div>
      </div>

      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', maxWidth: 1100, margin: '0 auto', padding: '0 40px 120px', gap: 80, position: 'relative' }}>
        {/* Steps */}
        <div style={{ position: 'relative', padding: '40px 0' }}>
          {/* Progress line */}
          <div style={{ position: 'absolute', left: 27, top: 0, bottom: 0, width: 2 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(110,231,183,0.06)', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${progress}%`, background: 'linear-gradient(to bottom, #6EE7B7, rgba(110,231,183,0.3))', borderRadius: 2, transition: 'height 0.4s ease' }} />
          </div>

          {STEPS.map((step, i) => (
            <div
              key={i}
              ref={stepRefs[i]}
              data-step={i}
              style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', padding: '40px 0', opacity: activeStep === i ? 1 : 0.3, transition: 'opacity 0.6s ease' }}
            >
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                {/* Number circle */}
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  background: activeStep === i ? 'rgba(110,231,183,0.12)' : 'rgba(110,231,183,0.04)',
                  border: `1.5px solid ${activeStep === i ? 'rgba(110,231,183,0.35)' : 'rgba(110,231,183,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#6EE7B7',
                  boxShadow: activeStep === i ? '0 0 40px rgba(110,231,183,0.2)' : 'none',
                  transition: 'all 0.6s ease',
                }}>
                  {i + 1}
                </div>
                <div style={{ paddingTop: 6 }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#F7F6F3', marginBottom: 12, letterSpacing: '-0.01em' }}>{step.title}</div>
                  <div style={{ fontSize: 15.5, lineHeight: 1.65, color: activeStep === i ? 'rgba(247,246,243,0.6)' : 'rgba(247,246,243,0.45)', fontWeight: 300, maxWidth: 400, transition: 'color 0.4s' }}>{step.body}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                    {step.features.map((f) => (
                      <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.12)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#6EE7B7', fontWeight: 500 }}>{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* JS-sticky phone column */}
        <div ref={phoneColRef} style={{ position: 'relative' }}>
          <div style={{
            position: phoneMode === 'fixed' ? 'fixed' : 'absolute',
            top: phoneMode === 'fixed' ? 120 : phoneMode === 'after' ? 'auto' : 20,
            bottom: phoneMode === 'after' ? 20 : 'auto',
            right: phoneMode === 'fixed' ? phoneRight : 0,
            width: 320,
            padding: '0 20px',
          }}>
            <div style={{ position: 'relative' }}>
              {/* Glow */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(110,231,183,0.08) 0%,transparent 70%)', zIndex: 0 }} />
              {/* Phone */}
              <div
                ref={phoneRef}
                onClick={advancePhone}
                style={{
                  width: 280, height: 560, background: '#1C3D2E', borderRadius: 44,
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 0 0 8px rgba(15,32,24,0.5),0 0 0 9px rgba(255,255,255,0.05),0 48px 120px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06)',
                  overflow: 'hidden', position: 'relative', cursor: 'pointer', zIndex: 1,
                }}
              >
                {/* Notch */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 28, background: '#0F2018', borderRadius: '0 0 18px 18px', zIndex: 10, border: '1px solid rgba(255,255,255,0.05)', borderTop: 'none' }} />

                {/* Tap hint */}
                <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'rgba(110,231,183,0.5)', zIndex: 20, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, animation: 'tapHintPulse 2s ease-in-out infinite' }}>
                  <span>{activeStep >= 2 ? '🔄' : '👆'}</span>
                  {activeStep >= 2 ? 'Tap to replay' : 'Tap to continue'}
                </div>

                {/* Screen 1 */}
                <div style={{ position: 'absolute', inset: 0, opacity: activeStep === 0 ? 1 : 0, transform: activeStep === 0 ? 'scale(1)' : 'scale(0.96)', transition: 'all .6s cubic-bezier(.4,0,.2,1)', pointerEvents: activeStep === 0 ? 'auto' : 'none' }}>
                  <Screen1 />
                </div>

                {/* Screen 2 */}
                <Screen2 active={activeStep === 1} />

                {/* Screen 3 */}
                <Screen3 active={activeStep === 2} />
              </div>

              {/* Dots */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} onClick={() => { setActiveStep(i); setProgress((i / 2) * 100) }} style={{ width: activeStep === i ? 24 : 8, height: 8, borderRadius: activeStep === i ? 4 : '50%', background: activeStep === i ? '#6EE7B7' : 'rgba(110,231,183,0.15)', border: '1px solid rgba(110,231,183,0.2)', transition: 'all 0.4s', boxShadow: activeStep === i ? '0 0 10px rgba(110,231,183,0.5)' : 'none', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  )
}
