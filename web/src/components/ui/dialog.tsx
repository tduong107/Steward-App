import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
    } else {
      setVisible(false)
      const timer = setTimeout(() => setMounted(false), 200)
      return () => clearTimeout(timer)
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  if (!mounted) return null

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full max-w-[calc(100vw-2rem)] sm:max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xl transition-all duration-200',
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-light)] hover:bg-[var(--color-bg-deep)] hover:text-[var(--color-ink)] transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export { Dialog }
