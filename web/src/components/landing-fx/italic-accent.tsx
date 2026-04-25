'use client'

/**
 * ItalicAccent — wraps the emphasized phrase inside any hero-style
 * headline with the mint (or gold) gradient italic treatment.
 *
 *   <h2>Effortless savings in <ItalicAccent>three steps</ItalicAccent></h2>
 *
 * The actual gradient + drop-shadow lives in globals.css `.italic-accent`.
 */

export function ItalicAccent({
  children,
  variant = 'mint',
  as = 'em',
  className,
  style,
}: {
  children: React.ReactNode
  variant?: 'mint' | 'gold'
  as?: 'em' | 'span'
  className?: string
  style?: React.CSSProperties
}) {
  const Tag = as as React.ElementType
  const cls = `italic-accent${variant === 'gold' ? ' italic-accent--gold' : ''}${className ? ` ${className}` : ''}`
  return (
    <Tag className={cls} style={style}>
      {children}
    </Tag>
  )
}
