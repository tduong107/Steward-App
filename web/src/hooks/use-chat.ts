'use client'

import { useCallback, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage, ProductLink, Watch } from '@/lib/types'

// Detect URLs in text (matches iOS enrichURLsInText behavior)
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi

// Watch limits per tier (matches iOS)
export const WATCH_LIMITS: Record<string, number> = {
  free: 3,
  pro: 7,
  premium: 15,
}

// ── Category chips & follow-ups (matches iOS ChatMessage.categoryFollowUp) ──
const CATEGORY_CHIPS = new Set(['Product', 'Travel', 'Reservation', 'Events', 'Camping', 'Screenshot', 'General'])

interface CategoryFollowUp {
  text: string
  suggestions?: string[]
}

const CATEGORY_FOLLOW_UPS: Record<string, CategoryFollowUp> = {
  Product: {
    text: 'Nice, what are you looking for?',
    suggestions: ['Track a price drop', 'Best price anywhere', 'Watch for a restock', 'Any changes (Beta)'],
  },
  Travel: {
    text: "Love a good deal ✈️ What kind of travel are you planning?",
    suggestions: ['Track flight prices', 'Watch hotel rates', 'Track car rental prices (Beta)', 'Any travel changes (Beta)'],
  },
  Reservation: {
    text: "I'm great at snagging hard-to-get reservations 🍽️ What are you trying to book?",
    suggestions: ['Watch Resy tables', 'Track other reservations (Beta)', 'Any changes (Beta)'],
  },
  Events: {
    text: "Let's find you those tickets 🎫 What event are you eyeing?",
    suggestions: ['Watch for event availability', 'Track event prices', 'Any changes (Beta)'],
  },
  Camping: {
    text: "Campsites go fast, I'll keep checking for you 🏕️\n\nPaste a Recreation.gov link or just tell me the campground and your dates.",
    suggestions: ['Watch for open campsites', 'Track campground availability'],
  },
  Screenshot: {
    text: "Go ahead and share a screenshot 📸\n\nCould be a product page, a price you spotted, a reservation, anything really. I'll figure out what it is and help you set up a watch.",
  },
  General: {
    text: "I can keep tabs on pretty much any webpage!\n\nHeads up, general watches are still in beta so results can vary depending on the site. For the most reliable tracking, try Product, Events, or Camping.",
    suggestions: ['Track price changes (Beta)', 'Watch for any updates (Beta)', 'Monitor availability (Beta)'],
  },
}

// Special chip handlers (matches iOS local handling)
const SPECIAL_CHIPS: Record<string, CategoryFollowUp> = {
  'best price anywhere': {
    text: "I'll hunt down the best deal across all stores for you 🏷️\n\nSend me a link or just tell me what you're looking for.",
  },
  'watch resy tables': {
    text: "On it! Paste the Resy link for the restaurant and I'll keep checking for open tables 🍷",
  },
  'watch for open campsites': {
    text: "Campsites disappear fast, but I'm on it 🏕️\n\nPaste a Recreation.gov link, or just tell me the campground name and when you want to go.",
  },
  'track campground availability': {
    text: "Campsites disappear fast, but I'm on it 🏕️\n\nPaste a Recreation.gov link, or just tell me the campground name and when you want to go.",
  },
  'watch for event availability': {
    text: "I'll keep an eye out for tickets 🎫\n\nPaste a link to the event page or tell me what event you're looking for.",
  },
  'track event prices': {
    text: "I'll keep an eye out for tickets 🎫\n\nPaste a link to the event page or tell me what event you're looking for.",
  },
}

function parseWatchData(text: string): Partial<Watch> | undefined {
  const match = text.match(/\[CREATE_WATCH\]([\s\S]*?)\[\/CREATE_WATCH\]/)
  if (!match) return undefined
  try {
    const raw = JSON.parse(match[1])
    return mapWatchJson(raw)
  } catch {
    return undefined
  }
}

/** Parse [PROPOSE_WATCH] blocks — AI sometimes puts JSON inside */
function parseProposedWatchData(text: string): Partial<Watch> | undefined {
  const matchFull = text.match(/\[PROPOSE_WATCH\]\s*([\s\S]*?)\s*\[\/PROPOSE_WATCH\]/)
  if (matchFull) {
    const content = matchFull[1].trim()
    if (content.startsWith('{')) {
      try { return mapWatchJson(JSON.parse(content)) } catch { /* fall through */ }
    }
  }
  const matchBare = text.match(/\[PROPOSE_WATCH\]\s*(\{[\s\S]*?\})/)
  if (matchBare) {
    try { return mapWatchJson(JSON.parse(matchBare[1])) } catch { /* fall through */ }
  }
  return undefined
}

function parseProposedWatch(text: string): boolean {
  return /\[PROPOSE_WATCH\]/.test(text)
}

function parseDismiss(text: string): boolean {
  return /\[DISMISS\]/.test(text)
}

/** Map camelCase JSON from AI to snake_case Watch fields */
function mapWatchJson(raw: Record<string, unknown>): Partial<Watch> {
  let url = (raw.url as string) || ''
  if (url && !url.match(/^https?:\/\//i)) {
    url = `https://${url}`
  }
  return {
    emoji: raw.emoji as string,
    name: raw.name as string,
    url,
    condition: raw.condition as string,
    action_label: (raw.actionLabel || raw.action_label) as string,
    action_type: (raw.actionType || raw.action_type || 'notify') as Watch['action_type'],
    check_frequency: (raw.checkFrequency || raw.check_frequency || 'Daily') as Watch['check_frequency'],
    image_url: (raw.imageURL || raw.image_url || null) as string | null,
  } as Partial<Watch>
}

function parseSuggestions(text: string): string[] | undefined {
  const match = text.match(/\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/)
  if (!match) return undefined
  const items = match[1].split('|').map((s) => s.trim()).filter(Boolean)
  return items.length > 0 ? items : undefined
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function parseProductLinks(text: string): ProductLink[] | undefined {
  const match = text.match(/\[PRODUCT_LINKS\]([\s\S]*?)\[\/PRODUCT_LINKS\]/)
  if (!match) return undefined
  const content = match[1].trim()

  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      const safe = (parsed as ProductLink[]).filter((p) => p.url && isSafeUrl(p.url))
      return safe.length > 0 ? safe : undefined
    }
  } catch { /* try newline-separated */ }

  const links: ProductLink[] = []
  const lines = content.split('\n').filter((l) => l.trim())
  for (const line of lines) {
    try {
      const obj = JSON.parse(line.trim())
      if (obj && obj.title && obj.url && isSafeUrl(obj.url)) {
        links.push({
          title: obj.title,
          url: obj.url,
          price: obj.price || '',
          image: obj.imageURL || obj.image || undefined,
          store: obj.source || obj.store || undefined,
        })
      }
    } catch { /* skip */ }
  }
  return links.length > 0 ? links : undefined
}

function stripTags(text: string): string {
  return text
    .replace(/\[CREATE_WATCH\][\s\S]*?\[\/CREATE_WATCH\]/g, '')
    .replace(/\[PROPOSE_WATCH\][\s\S]*?\[\/PROPOSE_WATCH\]/g, '')
    .replace(/\[PROPOSE_WATCH\]\s*\{[\s\S]*?\}/g, '')
    .replace(/\[PROPOSE_WATCH\]/g, '')
    .replace(/\[\/PROPOSE_WATCH\]/g, '')
    .replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/g, '')
    .replace(/\[PRODUCT_LINKS\][\s\S]*?\[\/PRODUCT_LINKS\]/g, '')
    .replace(/\[FETCH_PRICE\][\s\S]*?\[\/FETCH_PRICE\]/g, '')
    .replace(/\[DISMISS\]/g, '')
    .replace(/\[SUGGEST_WATCH\][\s\S]*?\[\/SUGGEST_WATCH\]/g, '')
    .replace(/\[UPDATE_WATCH\][\s\S]*?\[\/UPDATE_WATCH\]/g, '')
    .replace(/\[FIX_WATCH\][\s\S]*?\[\/FIX_WATCH\]/g, '')
    // Strip leaked JSON that wasn't inside tags (matches iOS leakedWatchJsonRegex)
    .replace(/\{"emoji"[\s\S]*?\}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Image data for screenshot analysis
interface ImageData {
  base64: string
  mediaType: string
}

// Separate type for internal conversation history (includes enriched context)
interface HistoryEntry {
  role: 'user' | 'assistant'
  content: string | Array<{ type: string; [key: string]: unknown }>
}

export function useChat(tier: string = 'free') {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isFirstMessageRef = useRef(true)
  const conversationHistoryRef = useRef<HistoryEntry[]>([])

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg])
    conversationHistoryRef.current.push({
      role: msg.role === 'steward' ? 'assistant' : 'user',
      content: msg.text,
    })
  }, [])

  const sendMessage = useCallback(
    async (text: string, image?: ImageData) => {
      const trimmed = text.trim()

      // ── Handle category chips locally (matches iOS — no AI call) ──
      if (CATEGORY_CHIPS.has(trimmed)) {
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          text: trimmed,
        }
        setMessages((prev) => [...prev, userMessage])
        conversationHistoryRef.current.push({ role: 'user', content: trimmed })

        // Seed history with welcome on first interaction
        if (isFirstMessageRef.current) {
          conversationHistoryRef.current.unshift({
            role: 'assistant',
            content: "Hey there! 👋 I'm Steward. I watch websites so you don't have to, and I'll let you know when something changes.\n\nWhat can I help you keep an eye on?",
          })
          isFirstMessageRef.current = false
        }

        const followUp = CATEGORY_FOLLOW_UPS[trimmed]
        if (followUp) {
          const stewardMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'steward',
            text: followUp.text,
            suggestions: followUp.suggestions,
          }
          // Small delay to feel conversational
          setTimeout(() => {
            setMessages((prev) => [...prev, stewardMsg])
            conversationHistoryRef.current.push({ role: 'assistant', content: followUp.text })
          }, 300)
        }
        return
      }

      // ── Handle special sub-category chips locally ──
      const lowerTrimmed = trimmed.toLowerCase()
      const specialHandler = SPECIAL_CHIPS[lowerTrimmed]
      if (specialHandler) {
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          text: trimmed,
        }
        setMessages((prev) => [...prev, userMessage])
        conversationHistoryRef.current.push({ role: 'user', content: trimmed })

        const stewardMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'steward',
          text: specialHandler.text,
          suggestions: specialHandler.suggestions,
        }
        setTimeout(() => {
          setMessages((prev) => [...prev, stewardMsg])
          conversationHistoryRef.current.push({ role: 'assistant', content: specialHandler.text })
        }, 300)
        return
      }

      // ── Handle Beta-tagged chips — strip "(Beta)", show disclaimer, don't call AI ──
      if (trimmed.endsWith('(Beta)')) {
        const cleanText = trimmed.replace(/\s*\(Beta\)$/, '')
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          text: cleanText,
        }
        setMessages((prev) => [...prev, userMessage])
        conversationHistoryRef.current.push({ role: 'user', content: cleanText })

        const disclaimer: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'steward',
          text: "Just a heads up, this one's still in beta so it might not catch every change perfectly. But let's give it a shot!\n\nDrop me a link and I'll get it set up 🔗",
        }
        setTimeout(() => {
          setMessages((prev) => [...prev, disclaimer])
          conversationHistoryRef.current.push({ role: 'assistant', content: disclaimer.text })
        }, 300)
        return
      }

      // ── Normal message → send to AI ──
      const displayText = image ? `📸 ${text}` : text
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text: displayText,
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const supabase = createClient()
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        const { data: { session } } = await supabase.auth.getSession()
        const accessToken = session?.access_token

        let enrichedText = text

        // Seed history + inject tier on first AI call
        if (isFirstMessageRef.current) {
          const tierLabel = tier === 'premium' ? 'Premium' : tier === 'pro' ? 'Pro' : 'Free'
          enrichedText = `[USER_TIER]${tierLabel}[/USER_TIER]\n${enrichedText}`

          // Only seed welcome if history is empty
          if (conversationHistoryRef.current.length === 0) {
            conversationHistoryRef.current.push({
              role: 'assistant',
              content: "Hey there! 👋 I'm Steward. I watch websites so you don't have to, and I'll let you know when something changes.\n\nWhat can I help you keep an eye on?",
            })
          }
          isFirstMessageRef.current = false
        }

        // Resolve URLs
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
                const safeTitle = meta.title ? meta.title.replace(/[\[\]]/g, '') : null
                const parts = [`URL: ${urls[0]}`]
                if (meta.resolvedUrl && meta.resolvedUrl !== urls[0]) parts.push(`resolves to: ${meta.resolvedUrl}`)
                if (safeTitle) parts.push(`Page title: "${safeTitle}"`)
                if (meta.price) parts.push(`Price found: $${meta.price}`)
                if (meta.hostname) parts.push(`Website: ${meta.hostname}`)
                enrichedText += `\n[URL_CONTEXT: I resolved the URLs for you. Here is what I found:\n${parts.join(' | ')}]`
              }
            }
          } catch { /* continue without context */ }
        }

        // Build multimodal content if image
        let messageContent: string | Array<{ type: string; [key: string]: unknown }>
        if (image) {
          messageContent = [
            { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } },
            { type: 'text', text: enrichedText },
          ]
        } else {
          messageContent = enrichedText
        }

        conversationHistoryRef.current.push({ role: 'user', content: messageContent })

        const history = conversationHistoryRef.current.slice(-30)

        const headers: Record<string, string> = {
          apikey: anonKey,
          'Content-Type': 'application/json',
        }
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

        const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages: history }),
        })

        if (!response.ok) throw new Error(`Chat request failed: ${response.status}`)

        const data = await response.json()
        const rawText: string = data.text ?? data.reply ?? data.content ?? ''

        conversationHistoryRef.current.push({ role: 'assistant', content: rawText })

        // Parse watch data — CREATE_WATCH means auto-create, PROPOSE_WATCH means show card
        const createWatchData = parseWatchData(rawText)
        const proposedWatchData = parseProposedWatchData(rawText)
        const isProposal = parseProposedWatch(rawText)
        const isDismiss = parseDismiss(rawText)
        const suggestions = parseSuggestions(rawText)

        // If CREATE_WATCH found, auto-create (no card shown) — matches iOS behavior
        // If PROPOSE_WATCH found, show card with "Create Watch" button
        const finalSuggestions = isProposal && !createWatchData && (!suggestions || suggestions.length === 0)
          ? ['Yes, create it!', 'Change something', 'Cancel']
          : suggestions

        const stewardMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'steward',
          text: stripTags(rawText),
          // Only show watch card for proposals (not auto-creates)
          watchData: createWatchData ? undefined : proposedWatchData,
          suggestions: finalSuggestions,
          productLinks: parseProductLinks(rawText),
          dismiss: isDismiss,
          // Pass auto-create data so the drawer can handle it
          autoCreateWatch: createWatchData,
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

  const clearMessages = useCallback(() => {
    setMessages([])
    conversationHistoryRef.current = []
    isFirstMessageRef.current = true
  }, [])

  return { messages, sendMessage, isLoading, clearMessages, addMessage }
}
