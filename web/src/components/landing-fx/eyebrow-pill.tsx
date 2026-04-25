'use client'

/**
 * EyebrowPill — small uppercase tag rendered above section headlines.
 *
 * Visual is owned by `.eyebrow-pill` in globals.css (mint background,
 * mint border, animated shimmer pseudo-element). Pass `variant="gold"`
 * on Steward-Acts moments.
 */

export function EyebrowPill({
  children,
  variant = 'mint',
  icon = '✦',
  className,
  style,
}: {
  children: React.ReactNode
  variant?: 'mint' | 'gold'
  icon?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const cls = `eyebrow-pill${variant === 'gold' ? ' eyebrow-pill--gold' : ''}${className ? ` ${className}` : ''}`
  return (
    <span className={cls} style={style}>
      {icon !== null && (
        <span aria-hidden="true" style={{ fontSize: 12, lineHeight: 1 }}>
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}
