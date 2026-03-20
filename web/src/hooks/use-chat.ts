'use client'

import { useCallback, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage, ProductLink, Watch } from '@/lib/types'

// Detect URLs in text (matches iOS enrichURLsInText behavior)
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi

function parseWatchData(text: string): Partial<Watch> | undefined {
  const match = text.match(/\[CREATE_WATCH\]([\s\S]*?)\[\/CREATE_WATCH\]/)
  if (!match) return undefined
  try {
    const raw = JSON.parse(match[1])
    // Map camelCase keys from the edge function to snake_case for the database
    let url = raw.url || ''
    // Ensure URL has protocol (matches iOS createWatchFromJSON)
    if (url && !url.match(/^https?:\/\//i)) {
      url = `https://${url}`
    }
    return {
      emoji: raw.emoji,
      name: raw.name,
      url,
      condition: raw.condition,
      action_label: raw.actionLabel || raw.action_label,
      action_type: raw.actionType || raw.action_type || 'notify',
      check_frequency: raw.checkFrequency || raw.check_frequency || 'Daily',
      image_url: raw.imageURL || raw.image_url || null,
    } as Partial<Watch>
  } catch {
    return undefined
  }
}

function parseProposedWatch(text: string): boolean {
  return /\[PROPOSE_WATCH\]/.test(text)
}

function parseSuggestions(text: string): string[] | undefined {
  const match = text.match(/\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/)
  if (!match) return undefined
  const items = match[1].split('|').map((s) => s.trim()).filter(Boolean)
  return items.length > 0 ? items : undefined
}

function parseProductLinks(text: string): ProductLink[] | undefined {
  const match = text.match(/\[PRODUCT_LINKS\]([\s\S]*?)\[\/PRODUCT_LINKS\]/)
  if (!match) return undefined
  const content = match[1].trim()

  // Try parsing as a JSON array first (if the whole block is a valid array)
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed as ProductLink[]
  } catch {
    // Not a single JSON array — try newline-separated JSON objects
    // (this is the format the edge function actually returns)
  }

  // Parse newline-separated JSON objects (edge function format)
  const links: ProductLink[] = []
  const lines = content.split('\n').filter((l) => l.trim())
  for (const line of lines) {
    try {
      const obj = JSON.parse(line.trim())
      if (obj && obj.title && obj.url) {
        links.push({
          title: obj.title,
          url: obj.url,
          price: obj.price || '',
          image: obj.imageURL || obj.image || undefined,
          store: obj.source || obj.store || undefined,
        })
      }
    } catch {
      // Skip non-JSON lines
    }
  }

  return links.length > 0 ? links : undefined
}

function stripTags(text: string): string {
  return text
    .replace(/\[CREATE_WATCH\][\s\S]*?\[\/CREATE_WATCH\]/g, '')
    .replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/g, '')
    .replace(/\[PRODUCT_LINKS\][\s\S]*?\[\/PRODUCT_LINKS\]/g, '')
    .replace(/\[PROPOSE_WATCH\]/g, '')
    .replace(/\[FETCH_PRICE\][\s\S]*?\[\/FETCH_PRICE\]/g, '')
    .replace(/\[DISMISS\]/g, '')
    .replace(/\[SUGGEST_WATCH\][\s\S]*?\[\/SUGGEST_WATCH\]/g, '')
    .replace(/\[UPDATE_WATCH\][\s\S]*?\[\/UPDATE_WATCH\]/g, '')
    .replace(/\[FIX_WATCH\][\s\S]*?\[\/FIX_WATCH\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Separate type for internal conversation history (includes enriched context)
interface HistoryEntry {
  role: 'user' | 'assistant'
  content: string
}

export function useChat(tier: string = 'free') {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isFirstMessageRef = useRef(true)
  // Separate conversation history that preserves enriched context (matches iOS conversationHistory)
  const conversationHistoryRef = useRef<HistoryEntry[]>([])

  const sendMessage = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text,
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const supabase = createClient()
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        // Get the user's session token for authenticated requests
        const { data: { session } } = await supabase.auth.getSession()
        const accessToken = session?.access_token

        // Enrich the user message with context (matches iOS behavior)
        let enrichedText = text

        // Inject [USER_TIER] on first message (matches iOS ChatViewModel.send())
        if (isFirstMessageRef.current) {
          const tierLabel = tier === 'premium' ? 'Premium' : tier === 'pro' ? 'Pro' : 'Free'
          enrichedText = `[USER_TIER]${tierLabel}[/USER_TIER]\n${enrichedText}`
          isFirstMessageRef.current = false
        }

        // Resolve URLs in the message (matches iOS enrichURLsInText)
        const urls = text.match(URL_REGEX)
        if (urls && urls.length > 0) {
          try {
            const res = await fetch('/api/resolve-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: urls[0] }),
            })
            if (res.ok) {
              const meta = await res.json()
              if (meta.title || meta.price) {
                // Sanitize title to avoid breaking bracket format
                const safeTitle = meta.title ? meta.title.replace(/[\[\]]/g, '') : null
                const parts = [`URL: ${urls[0]}`]
                if (meta.resolvedUrl && meta.resolvedUrl !== urls[0]) {
                  parts.push(`resolves to: ${meta.resolvedUrl}`)
                }
                if (safeTitle) parts.push(`Page title: "${safeTitle}"`)
                if (meta.price) parts.push(`Price found: $${meta.price}`)
                if (meta.hostname) parts.push(`Website: ${meta.hostname}`)
                enrichedText += `\n[URL_CONTEXT: I resolved the URLs for you. Here is what I found:\n${parts.join(' | ')}]`
              }
            }
          } catch {
            // URL resolution failed — continue without context
          }
        }

        // Add to conversation history (preserves enriched context like iOS)
        conversationHistoryRef.current.push({
          role: 'user',
          content: enrichedText,
        })

        // Build message list from our enriched history (capped at 30 like the edge function)
        const history = conversationHistoryRef.current.slice(-30)

        const headers: Record<string, string> = {
          apikey: anonKey,
          'Content-Type': 'application/json',
        }

        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages: history }),
        })

        if (!response.ok) {
          throw new Error(`Chat request failed: ${response.status}`)
        }

        const data = await response.json()
        const rawText: string = data.text ?? data.reply ?? data.content ?? ''

        // Store full AI response in history (with markers, so AI has context)
        conversationHistoryRef.current.push({
          role: 'assistant',
          content: rawText,
        })

        const watchData = parseWatchData(rawText)
        const isProposal = parseProposedWatch(rawText)
        const suggestions = parseSuggestions(rawText)

        // If it's a proposal (not yet confirmed), add confirm/deny suggestions
        const finalSuggestions = isProposal && !suggestions
          ? ['Yes, create it!', 'Change something', 'Cancel']
          : suggestions

        const stewardMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'steward',
          text: stripTags(rawText),
          watchData,
          suggestions: finalSuggestions,
          productLinks: parseProductLinks(rawText),
        }

        setMessages((prev) => [...prev, stewardMessage])
      } catch (err) {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'steward',
          text: 'Sorry, something went wrong. Please try again.',
        }
        setMessages((prev) => [...prev, errorMessage])
        console.error('Chat error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [tier]
  )

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg])
    // Also add to conversation history so AI sees it
    conversationHistoryRef.current.push({
      role: msg.role === 'steward' ? 'assistant' : 'user',
      content: msg.text,
    })
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    conversationHistoryRef.current = []
    isFirstMessageRef.current = true
  }, [])

  return { messages, sendMessage, isLoading, clearMessages, addMessage }
}
