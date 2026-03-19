import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-ink)]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'h-10 w-full rounded-[var(--radius-md)] border bg-[var(--color-bg)] px-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-light)] transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-[var(--color-red)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-mid)]',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--color-red)]">{error}</p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
