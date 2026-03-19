import * as React from 'react'
import { cn } from '@/lib/utils'

const variants = {
  default:
    'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  secondary:
    'bg-[var(--color-bg-deep)] text-[var(--color-ink-light)]',
  triggered:
    'bg-[var(--color-green-light)] text-[var(--color-green)]',
  warning:
    'bg-[var(--color-gold-light)] text-[var(--color-gold)]',
  error:
    'bg-[var(--color-red-light)] text-[var(--color-red)]',
} as const

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
