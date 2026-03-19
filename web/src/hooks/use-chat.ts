'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage, ProductLink, Watch } from '@/lib/types'

function parseWatchData(text: string): Partial<Watch> | undefined {
  const match = text.match(/\[CREATE_WATCH\]([\s\S]*?)\[\/CREATE_WATCH\]/)
  if (!match) return undefined
  try {
    const raw = JSON.parse(match[1])
    // Map camelCase keys from the edge function to snake_case for the database
    return {
      emoji: raw.emoji,
      name: raw.name,
      url: raw.url,
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

  // The edge function enriches product links into JSON array format
  // Try parsing as JSON first (enriched format from the server)
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed as ProductLink[]
  } catch {
    // Not JSON — it might be the raw "search:query" format
    // which means the server didn't enrich it; skip rendering
  }

  return undefined
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

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

        // Build conversation history for the API
        const history = [...messages, userMessage].map((m) => ({
          role: m.role === 'steward' ? 'assistant' : 'user',
          content: m.text,
        }))

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
    [messages]
  )

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, sendMessage, isLoading, clearMessages, addMessage }
}
