import * as React from 'react'
import { cn } from '@/lib/utils'

const variants = {
  default:
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-mid)] active:bg-[var(--color-accent-mid)]',
  secondary:
    'bg-[var(--color-bg-deep)] text-[var(--color-ink)] hover:bg-[var(--color-border)] active:bg-[var(--color-border)]',
  outline:
    'border border-[var(--color-border)] bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-bg-deep)] active:bg-[var(--color-bg-deep)]',
  ghost:
    'bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-bg-deep)] active:bg-[var(--color-bg-deep)]',
  destructive:
    'bg-[var(--color-red)] text-white hover:opacity-90 active:opacity-80',
} as const

const sizes = {
  sm: 'h-8 px-3 text-sm rounded-[var(--radius-md)]',
  default: 'h-10 px-4 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-6 text-base rounded-[var(--radius-lg)]',
  icon: 'h-10 w-10 rounded-[var(--radius-md)]',
} as const

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
          variants[variant],
          sizes[size],
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
