'use client'

import { useCallback, useState } from 'react'
import type { ChatMessage, ProductLink, Watch } from '@/lib/types'

function parseWatchData(text: string): Partial<Watch> | undefined {
  const match = text.match(/\[CREATE_WATCH\]([\s\S]*?)\[\/CREATE_WATCH\]/)
  if (!match) return undefined
  try {
    return JSON.parse(match[1]) as Partial<Watch>
  } catch {
    return undefined
  }
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
  try {
    const parsed = JSON.parse(match[1])
    return Array.isArray(parsed) ? (parsed as ProductLink[]) : undefined
  } catch {
    return undefined
  }
}

function stripTags(text: string): string {
  return text
    .replace(/\[CREATE_WATCH\][\s\S]*?\[\/CREATE_WATCH\]/g, '')
    .replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/g, '')
    .replace(/\[PRODUCT_LINKS\][\s\S]*?\[\/PRODUCT_LINKS\]/g, '')
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
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        // Build conversation history for the API
        const history = [...messages, userMessage].map((m) => ({
          role: m.role === 'steward' ? 'assistant' : 'user',
          content: m.text,
        }))

        const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages: history }),
        })

        if (!response.ok) {
          throw new Error(`Chat request failed: ${response.status}`)
        }

        const data = await response.json()
        const rawText: string = data.reply ?? data.content ?? ''

        const stewardMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'steward',
          text: stripTags(rawText),
          watchData: parseWatchData(rawText),
          suggestions: parseSuggestions(rawText),
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

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, sendMessage, isLoading, clearMessages }
}
