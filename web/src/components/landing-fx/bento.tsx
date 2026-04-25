'use client'

/**
 * Bento — base card for every feature/pricing/how-it-works panel.
 *
 * - Visual baseline lives in globals.css `.bento` (background, border,
 *   radius, hover lift, radial cursor-tracked overlay).
 * - This wrapper just owns mouse tracking, writing the cursor's local
 *   position into `--mx` / `--my` CSS variables. The CSS handles the
 *   actual fade-in / fade-out of the radial.
 * - Pass `variant="gold"` for the Steward-Acts moments (premium tier,
 *   Steward Acts section). All other usages stay mint.
 */

import { useRef } from 'react'

type Props = {
  as?: keyof React.JSX.IntrinsicElements
  variant?: 'mint' | 'gold'
  className?: string
  style?: React.CSSProperties
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
  children: React.ReactNode
}

export function Bento({
  as = 'div',
  variant = 'mint',
  className,
  style,
  onClick,
  children,
}: Props) {
  const ref = useRef<HTMLElement | null>(null)

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  const baseClass = `bento${variant === 'gold' ? ' bento--gold' : ''}${className ? ` ${className}` : ''}`

  // Cast to a generic JSX intrinsic. We restrict `as` to intrinsic
  // elements so this stays a pure DOM wrapper.
  const Tag = as as React.ElementType
  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={baseClass}
      style={style}
      onClick={onClick}
      onMouseMove={handleMove}
    >
      {children}
    </Tag>
  )
}
