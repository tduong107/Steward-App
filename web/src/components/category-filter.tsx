'use client'

import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  selected: string
  onChange: (value: string) => void
}

const categories = [
  { label: 'All', value: '' },
  { label: 'Price', value: 'price' },
  { label: 'Cart', value: 'cart' },
  { label: 'Book', value: 'book' },
  { label: 'Notify', value: 'notify' },
]

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {categories.map((cat) => (
        <button
          key={cat.value}
          type="button"
          onClick={() => onChange(cat.value)}
          className={cn(
            'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150',
            selected === cat.value
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[var(--color-bg-deep)] text-[var(--color-ink-mid)] hover:bg-[var(--color-border)]',
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
