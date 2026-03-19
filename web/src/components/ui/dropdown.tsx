import * as React from 'react'
import { cn } from '@/lib/utils'

export interface DropdownOption {
  label: string
  value: string
}

export interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
  disabled?: boolean
}

function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  className,
  disabled,
}: DropdownProps) {
  const id = React.useId()

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-[var(--color-ink)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            'h-10 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 pr-9 text-sm text-[var(--color-ink)] transition-colors duration-150',
            'hover:border-[var(--color-border-mid)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-[var(--color-ink-light)]',
            className,
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-light)]"
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </div>
    </div>
  )
}

export { Dropdown }
