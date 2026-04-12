'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import posthog from 'posthog-js'
import { X, SendHorizontal, RotateCcw, ImagePlus, Mic, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChat, WATCH_LIMITS } from '@/hooks/use-chat'
import { useWatches } from '@/hooks/use-watches'
import { useSub } from '@/hooks/use-subscription'
import { useChatDrawer } from '@/providers/chat-provider'
import { ChatMessage } from '@/components/chat-message'
import { PaywallDialog } from '@/components/paywall-dialog'
import type { Watch } from '@/lib/types'

interface ChatDrawerProps {
  open: boolean
  onClose: () => void
}

// ── Category chips matching iOS ChatMessage.categoryChips ──
const categoryChips = [
  'Product',
  'Travel',
  'Reservation',
  'Events',
  'Camping',
  'Screenshot',
  'General',
  'Need help?',
]
const betaInitialChips = new Set(['General'])

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2">
        <Image
          src="/steward-logo.png"
          alt=""
          width={22}
          height={22}
          className="mt-2.5 rounded-[5px] shrink-0"
        />
        <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-[var(--color-bg-deep)] px-4 py-3">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-ink-light)] [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-ink-light)] [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-ink-light)] [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

export function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const { tier } = useSub()
  const { messages, sendMessage, isLoading, clearMessages, addMessage } = useChat(tier)
  const { watches, createWatch } = useWatches()
  const { consumeInitialMessage } = useChatDrawer()
  const [input, setInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Voice input (Web Speech API) ─────────────────────────────
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const hasSpeechSupport = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      // Stop
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    // Start
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    let finalTranscript = ''

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interim = transcript
        }
      }
      setInput(finalTranscript + interim)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        console.log('[voice] Speech recognition error:', event.error)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isListening])

  // Stop listening when drawer closes
  useEffect(() => {
    if (!open && isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }
  }, [open, isListening])

  // Mount/unmount with animation
  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
    } else {
      setVisible(false)
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Focus input when drawer opens
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [visible])

  // Auto-send prefilled message when drawer opens with context
  useEffect(() => {
    if (open && visible) {
      const prefill = consumeInitialMessage()
      if (prefill) {
        setInput(prefill)
        // Auto-send after a short delay so the UI renders first
        setTimeout(() => {
          sendMessage(prefill)
          setInput('')
        }, 500)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visible])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Auto-close on [DISMISS] — watch for new messages with dismiss flag
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.dismiss) {
      const timer = setTimeout(() => {
        onClose()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [messages, onClose])

  // Auto-create watches when AI sends [CREATE_WATCH] (matches iOS behavior)
  const autoCreateProcessedRef = useRef(new Set<string>())
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg?.autoCreateWatch || autoCreateProcessedRef.current.has(lastMsg.id)) return
    autoCreateProcessedRef.current.add(lastMsg.id)

    // Auto-create with limit check
    const doAutoCreate = async () => {
      const activeWatches = watches.filter((w) => w.status !== 'deleted')
      const limit = WATCH_LIMITS[tier] ?? WATCH_LIMITS.free
      if (activeWatches.length >= limit) {
        setShowPaywall(true)
        addMessage({
          id: crypto.randomUUID(),
          role: 'steward',
          text: `You've reached the ${limit}-watch limit on your ${tier === 'free' ? 'Free' : tier === 'pro' ? 'Pro' : 'Premium'} plan. Upgrade to add more watches!`,
          suggestions: ['Upgrade plan'],
        })
        return
      }

      try {
        await createWatch(lastMsg.autoCreateWatch!)
        // No extra confirmation message — the AI's response already says "You're all set!"
        // This matches iOS behavior where createWatchFromJSON doesn't add a separate message
      } catch (err) {
        console.error('Auto-create watch failed:', err)
        setShowPaywall(true)
        addMessage({
          id: crypto.randomUUID(),
          role: 'steward',
          text: `Couldn't create the watch — you may have hit your ${tier === 'free' ? 'Free' : tier === 'pro' ? 'Pro' : 'Premium'} plan limit. Upgrade to add more!`,
          suggestions: ['Upgrade plan'],
        })
      }
    }

    doAutoCreate()
  }, [messages, watches, tier, createWatch, addMessage])

  // Cleanup image preview URL on unmount
  useEffect(() => {
    return () => {
      if (pendingImage) URL.revokeObjectURL(pendingImage.preview)
    }
  }, [pendingImage])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if ((!text && !pendingImage) || isLoading) return
    setInput('')
    if (pendingImage) {
      // Convert image to base64 and send
      const reader = new FileReader()
      const imageToSend = pendingImage
      reader.onload = () => {
        const dataUrl = reader.result as string
        const commaIdx = dataUrl.indexOf(',')
        const base64 = commaIdx >= 0 ? dataUrl.substring(commaIdx + 1) : dataUrl
        const mediaType = imageToSend.file.type || 'image/jpeg'
        sendMessage(text || 'What is this?', { base64, mediaType })
      }
      reader.readAsDataURL(imageToSend.file)
      // Revoke the old preview URL and clear pending image immediately
      URL.revokeObjectURL(pendingImage.preview)
      setPendingImage(null)
    } else {
      sendMessage(text)
    }
    posthog.capture('ai_chat_message_sent', { has_image: !!pendingImage, message_length: text.length })
  }, [input, isLoading, sendMessage, pendingImage])

  const handleSuggestionClick = useCallback(
    (text: string) => {
      if (isLoading) return
      sendMessage(text)
    },
    [isLoading, sendMessage],
  )

  const handleCreateWatch = useCallback(
    async (data: Partial<Watch>) => {
      if (isCreating) return
      setIsCreating(true)

      // Check watch limit before attempting creation
      const activeWatches = watches.filter((w) => w.status !== 'deleted')
      const limit = WATCH_LIMITS[tier] ?? WATCH_LIMITS.free
      if (activeWatches.length >= limit) {
        // Show the paywall popup immediately
        setShowPaywall(true)
        addMessage({
          id: crypto.randomUUID(),
          role: 'steward',
          text: `You've reached the ${limit}-watch limit on your ${tier === 'free' ? 'Free' : tier === 'pro' ? 'Pro' : 'Premium'} plan. Upgrade to add more watches!`,
          suggestions: ['Upgrade plan'],
        })
        setIsCreating(false)
        return
      }

      try {
        const created = await createWatch(data)
        addMessage({
          id: crypto.randomUUID(),
          role: 'steward',
          text: `Done! I created "${created.name || data.name || 'your watch'}". I'll start monitoring it right away and notify you when conditions are met.`,
          suggestions: ['Create another watch', 'Show my watches'],
        })
      } catch (err) {
        console.error('Failed to create watch from chat:', err)
        // Any creation failure — show paywall since it's most likely a limit issue
        setShowPaywall(true)
        addMessage({
          id: crypto.randomUUID(),
          role: 'steward',
          text: `You've hit your watch limit on the ${tier === 'free' ? 'Free' : tier === 'pro' ? 'Pro' : 'Premium'} plan. Upgrade to create more watches!`,
          suggestions: ['Upgrade plan'],
        })
      } finally {
        setIsCreating(false)
      }
    },
    [createWatch, addMessage, isCreating, watches, tier],
  )

  // Handle special suggestion clicks (e.g. "Upgrade plan", "Email support")
  const handleSuggestionClickWrapped = useCallback(
    (text: string) => {
      if (text === 'Upgrade plan') {
        setShowPaywall(true)
        return
      }
      if (text === 'Show my watches') {
        onClose()
        return
      }
      if (text === 'Email support') {
        window.open('mailto:hello@joinsteward.app?subject=Steward%20Support', '_blank')
        return
      }
      handleSuggestionClick(text)
    },
    [handleSuggestionClick, onClose],
  )

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Validate file type and size (max 5MB)
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB')
      return
    }
    const preview = URL.createObjectURL(file)
    // Revoke any existing preview URL to prevent memory leak
    setPendingImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.preview)
      return { file, preview }
    })
    // Reset file input so re-selecting same file works
    e.target.value = ''
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!mounted) return null

  const hasContent = input.trim() || pendingImage

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Panel — right on desktop, bottom on mobile */}
      <div
        className={cn(
          'absolute flex flex-col bg-[var(--color-bg)] transition-transform duration-300 ease-out',
          'md:right-0 md:top-0 md:h-full md:w-96 md:border-l md:border-[var(--color-border)]',
          visible ? 'md:translate-x-0' : 'md:translate-x-full',
          'max-md:inset-x-0 max-md:bottom-0 max-md:h-[85dvh] max-md:rounded-t-[var(--radius-xl)]',
          visible ? 'max-md:translate-y-0' : 'max-md:translate-y-full',
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/steward-logo.png"
              alt="Steward"
              width={34}
              height={34}
              className="rounded-lg"
            />
            <div>
              <h2 className="text-[15px] font-semibold font-[var(--font-serif)] text-[var(--color-ink)]">
                Steward AI
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-[var(--color-ink-light)]">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearMessages}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-light)] hover:bg-[var(--color-bg-deep)] hover:text-[var(--color-ink)] transition-colors"
                aria-label="New chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-light)] hover:bg-[var(--color-bg-deep)] hover:text-[var(--color-ink)] transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* ── Welcome state (matches iOS ChatDrawer initial view) ── */}
          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="shrink-0 mt-2">
                  <Image
                    src="/steward-logo.png"
                    alt=""
                    width={22}
                    height={22}
                    className="rounded-[5px]"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <span className="text-[11px] text-[var(--color-ink-light)]">Steward</span>
                  <div className="rounded-2xl rounded-bl-md bg-[var(--color-bg-deep)] px-4 py-2.5 text-sm leading-relaxed text-[var(--color-ink)]">
                    <p>Hello! I&apos;m Steward, your personal web watcher. I keep an eye on websites and take action on your behalf.</p>
                    <p className="mt-1.5">What are you looking to watch?</p>
                  </div>
                  {/* Category chips — matches iOS exactly */}
                  <div className="flex flex-wrap gap-[7px] pt-1">
                    {categoryChips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleSuggestionClickWrapped(chip)}
                        className="flex items-center gap-[5px] rounded-full border border-[var(--color-accent-mid)] bg-[var(--color-bg-card)] px-3.5 py-[7px] text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-light)]"
                      >
                        {chip}
                        {betaInitialChips.has(chip) && (
                          <span className="rounded-full bg-orange-500 px-[5px] py-[2px] text-[9px] font-bold leading-none text-white">
                            Beta
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onSuggestionClick={handleSuggestionClickWrapped}
              onCreateWatch={handleCreateWatch}
            />
          ))}

          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Image preview (when screenshot is attached) ── */}
        {pendingImage && (
          <div className="shrink-0 border-t border-[var(--color-border)] px-4 pt-3 pb-1">
            <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-deep)] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingImage.preview}
                alt="Screenshot preview"
                className="h-[60px] w-[60px] rounded-[var(--radius-sm)] object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-ink)]">Screenshot attached</p>
                <p className="text-xs text-[var(--color-ink-light)]">Send to analyze</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(pendingImage.preview)
                  setPendingImage(null)
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-ink-light)] hover:text-[var(--color-ink)] transition-colors"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Input area (matches iOS: image button + text field + send) ── */}
        <div className="shrink-0 border-t border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Image upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-light)] hover:bg-[var(--color-bg-deep)] hover:text-[var(--color-ink)] transition-colors"
              aria-label="Attach screenshot"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Listening...' : 'Describe what to watch...'}
                className={cn(
                  'w-full rounded-full bg-[var(--color-bg-deep)] px-4 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-light)] outline-none transition-all',
                  isListening
                    ? 'ring-2 ring-[var(--color-accent)] placeholder:text-[var(--color-accent)]'
                    : 'focus:ring-2 focus:ring-[var(--color-accent)]',
                )}
              />
              {isListening && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                </span>
              )}
            </div>

            {/* Mic button: shown when input is empty and speech is supported */}
            {hasSpeechSupport && !hasContent && !isListening && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-deep)] text-[var(--color-ink-light)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)] transition-colors"
                aria-label="Voice input"
              >
                <Mic className="h-4 w-4" />
              </button>
            )}

            {/* Stop button: shown while listening */}
            {isListening && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                aria-label="Stop listening"
              >
                <Square className="h-3.5 w-3.5" fill="currentColor" />
              </button>
            )}

            {/* Send button: shown when there's content and not listening */}
            {(hasContent || (!hasSpeechSupport && !isListening)) && !isListening && (
              <button
                type="button"
                onClick={handleSend}
                disabled={!hasContent || isLoading}
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                  hasContent && !isLoading
                    ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-mid)]'
                    : 'bg-[var(--color-bg-deep)] text-[var(--color-ink-light)]',
                )}
                aria-label="Send message"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Paywall dialog */}
      <PaywallDialog open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>,
    document.body,
  )
}
