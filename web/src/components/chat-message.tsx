'use client'

import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import type { ChatMessage as ChatMessageType, Watch } from '@/lib/types'
import { cn, getDomain } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ChatMessageProps {
  message: ChatMessageType
  onSuggestionClick: (text: string) => void
  onCreateWatch: (data: Partial<Watch>) => void
}

/** Initial category chips that show a "Beta" badge — mirrors iOS ChatMessage.betaCategories */
const betaCategories = new Set(['General'])

/** Check if a suggestion should show a Beta badge (matches iOS logic) */
function isBetaSuggestion(text: string): boolean {
  // Initial category chips
  if (betaCategories.has(text)) return true
  // Follow-up suggestions that end with "(Beta)"
  if (text.endsWith('(Beta)')) return true
  return false
}

/** Strip "(Beta)" suffix from display text since we show a badge instead */
function displayText(text: string): string {
  return text.replace(/\s*\(Beta\)$/, '')
}

export function ChatMessage({ message, onSuggestionClick, onCreateWatch }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%]', !isUser && 'flex items-start gap-2')}>
        {/* Steward avatar for AI messages — matches iOS StewardLogo(size:22) */}
        {!isUser && (
          <div className="shrink-0 mt-2">
            <Image
              src="/steward-logo.png"
              alt=""
              width={22}
              height={22}
              className="rounded-[5px]"
            />
          </div>
        )}

        <div className="space-y-2 min-w-0">
          {/* Steward label */}
          {!isUser && (
            <span className="text-[11px] text-[var(--color-ink-light)]">Steward</span>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words overflow-hidden',
              isUser
                ? 'bg-[var(--color-accent)] text-white rounded-br-md'
                : 'bg-[var(--color-bg-deep)] text-[var(--color-ink)] rounded-bl-md',
            )}
          >
            {message.text.split('\n').map((line, i) => (
              <p key={i} className={cn(i > 0 && 'mt-1.5', '[overflow-wrap:anywhere]')}>
                {line}
              </p>
            ))}
          </div>

          {/* Suggestion chips — matches iOS: capsule, accent border, FlowLayout */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-[7px] pt-1">
              {message.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onSuggestionClick(suggestion)}
                  className="flex items-center gap-[5px] rounded-full border border-[var(--color-accent-mid)] bg-[var(--color-bg-card)] px-3.5 py-[7px] text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-light)]"
                >
                  {displayText(suggestion)}
                  {/* Beta badge — matches iOS orange capsule */}
                  {isBetaSuggestion(suggestion) && (
                    <span className="rounded-full bg-orange-500 px-[5px] py-[2px] text-[9px] font-bold leading-none text-white">
                      Beta
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Watch creation card */}
          {message.watchData && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent-light)]">
                  <span className="text-lg">{message.watchData.emoji || '👀'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                    {message.watchData.name || 'New Watch'}
                  </p>
                  {message.watchData.url && (
                    <p className="truncate text-xs text-[var(--color-ink-light)]">
                      {getDomain(message.watchData.url)}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                className="mt-3 w-full"
                onClick={() => onCreateWatch(message.watchData!)}
              >
                Create Watch
              </Button>
            </div>
          )}

          {/* Product link cards */}
          {message.productLinks && message.productLinks.length > 0 && (
            <div className="space-y-2">
              {message.productLinks.map((product, i) => (
                <a
                  key={i}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-2.5 transition-colors hover:bg-[var(--color-bg-deep)]"
                >
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-[var(--radius-sm)] object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-bg-deep)]">
                      <ExternalLink className="h-5 w-5 text-[var(--color-ink-light)]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                      {product.title}
                    </p>
                    <div className="flex items-center gap-2">
                      {product.price && (
                        <span className="text-sm font-semibold text-[var(--color-accent)]">
                          {product.price}
                        </span>
                      )}
                      {product.store && (
                        <span className="text-xs text-[var(--color-ink-light)]">
                          {product.store}
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-[var(--color-ink-light)]" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
