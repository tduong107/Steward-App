/**
 * Landing-page presentational helpers. All Server Components — pure
 * markup, no state, no event handlers. They render once on the server
 * and ship as zero-JS HTML.
 *
 * Phase 10 server-shell refactor: these were inline functions inside
 * the giant `landing-client-page.tsx` client component. Moving them
 * here means the static SVG and chat bubble markup are no longer
 * part of the client bundle.
 *
 * Phase 10b cleanup: dropped `Pill`, `FeatTitle`, `FeatBody`, and
 * `FeatLink` exports — they were inherited from the old wrapper but
 * had zero callers after the section extraction. The two remaining
 * exports (`Logo`, `ChatBubble`) are both genuinely used.
 */

// ── Logo ─────────────────────────────────────────────────────────────────────
export function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 1024 1024" fill="none">
      <rect width="1024" height="1024" rx="224" fill="url(#l1)" />
      <path
        d="M448 488Q445 536 425 579Q405 622 367 649Q329 676 270 676Q208 676 175 641Q142 606 142 559Q142 517 166 488Q190 460 228 438Q267 417 310 397Q348 380 386 360Q424 341 455 316Q486 291 504 256Q523 222 523 174Q523 119 495 76Q468 33 416 8Q364 -16 289 -16Q244 -16 196 -3Q148 10 111 35L116 -8H64L58 205H97Q102 117 158 71Q214 26 293 26Q332 26 365 40Q398 55 417 83Q437 111 437 151Q437 196 413 226Q389 256 351 278Q313 300 270 320Q232 337 195 356Q158 375 127 399Q97 424 78 458Q60 492 60 540Q60 566 69 596Q78 626 100 653Q123 681 162 698Q202 716 263 716Q301 716 348 705Q396 695 437 665L433 708H484V488Z"
        transform="translate(388.55,660.22) scale(0.4235,-0.4235)"
        fill="url(#l2)"
      />
      <g transform="translate(607,355)">
        <circle cx="0" cy="0" r="22" fill="rgba(110,231,183,0.15)" />
        <path
          d="M0 -14 L3.5 -3.5 L14 0 L3.5 3.5 L0 14 L-3.5 3.5 L-14 0 L-3.5 -3.5 Z"
          fill="url(#l3)"
        />
      </g>
      <defs>
        <linearGradient id="l1" x1="512" y1="0" x2="512" y2="1024">
          <stop offset="0%" stopColor="#243D30" />
          <stop offset="100%" stopColor="#0F2018" />
        </linearGradient>
        <linearGradient id="l2" x1="512" y1="357" x2="512" y2="667">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#D1FAE5" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>
        <radialGradient id="l3" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </radialGradient>
      </defs>
    </svg>
  )
}

// ── Chat bubble (used by AIFeature; receives `visible` as prop) ─────────────
export function ChatBubble({
  visible,
  role,
  tag,
  children,
}: {
  visible: boolean
  role: 'user' | 'ai'
  tag?: string
  children: React.ReactNode
}) {
  const isUser = role === 'user'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: 6,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.3s var(--ease-out), transform 0.3s var(--ease-out)',
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '12px 16px',
          fontSize: 13.5,
          lineHeight: 1.5,
          color: isUser ? 'var(--deep, #0F2018)' : 'rgba(247,246,243,0.85)',
          background: isUser
            ? 'linear-gradient(135deg, var(--mint-2, #A7F3D0), var(--mint, #6EE7B7))'
            : 'rgba(255,255,255,0.05)',
          border: isUser ? 'none' : '1px solid rgba(255,255,255,0.07)',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          fontWeight: isUser ? 500 : 400,
          boxShadow: isUser ? '0 6px 18px rgba(110,231,183,0.22)' : 'none',
        }}
      >
        {children}
      </div>
      {tag && !isUser && (
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'rgba(110,231,183,0.75)',
          }}
        >
          {tag}
        </span>
      )}
    </div>
  )
}
