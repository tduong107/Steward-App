import { NextRequest, NextResponse } from 'next/server'

// SSRF protection: block private/internal URLs
function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    return (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.') ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local') ||
      hostname.startsWith('169.254.') ||
      hostname.includes('metadata.google')
    )
  } catch {
    return true
  }
}

// Extract price from HTML (simplified version matching edge function logic)
function extractPrice(html: string): number | null {
  // 1) OG / product meta tags
  const ogPatterns = [
    /property="(?:og|product):price:amount"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+property="(?:og|product):price:amount"/i,
  ]
  for (const p of ogPatterns) {
    const m = html.match(p)
    if (m) {
      const price = parseFloat(m[1].replace(/,/g, ''))
      if (price > 0.5 && price < 100_000) return price
    }
  }

  // 2) JSON-LD structured data
  const jsonLdPattern = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let jsonLdMatch
  while ((jsonLdMatch = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(jsonLdMatch[1])
      const price = findPriceInJsonLd(data)
      if (price !== null && price > 0.5 && price < 100_000) return price
    } catch {
      /* skip */
    }
  }

  // 3) Amazon-specific
  if (/amazon\.(com|co\.|ca|de|fr|it|es)/i.test(html)) {
    const amazonPatterns = [
      /corePrice[^}]*"value":\s*([\d.]+)/i,
      /priceToPay[\s\S]{0,200}?a-offscreen[^>]*>\s*\$\s*([\d,]+\.\d{2})/i,
    ]
    for (const p of amazonPatterns) {
      const m = html.match(p)
      if (m) {
        const price = parseFloat(m[1].replace(/,/g, ''))
        if (price > 0.5 && price < 100_000) return price
      }
    }
  }

  // 4) Generic price selectors
  const structuredPatterns = [
    /product[_-]?price[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
    /sale[_-]?price[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
    /current[_-]?price[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
  ]
  for (const p of structuredPatterns) {
    const m = html.match(p)
    if (m) {
      const price = parseFloat(m[1].replace(/,/g, ''))
      if (price > 0.5 && price < 100_000) return price
    }
  }

  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findPriceInJsonLd(obj: any): number | null {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = findPriceInJsonLd(item)
      if (r !== null) return r
    }
    return null
  }
  if (obj && typeof obj === 'object') {
    if (obj.price !== undefined) {
      const p =
        typeof obj.price === 'number'
          ? obj.price
          : parseFloat(String(obj.price).replace(/,/g, ''))
      if (!isNaN(p) && p > 0) return p
    }
    if (obj.lowPrice !== undefined) {
      const p =
        typeof obj.lowPrice === 'number'
          ? obj.lowPrice
          : parseFloat(String(obj.lowPrice).replace(/,/g, ''))
      if (!isNaN(p) && p > 0) return p
    }
    if (obj.offers) {
      return findPriceInJsonLd(obj.offers)
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Ensure URL has protocol
    let resolvedUrl = url
    if (!resolvedUrl.match(/^https?:\/\//i)) {
      resolvedUrl = `https://${resolvedUrl}`
    }

    if (isPrivateUrl(resolvedUrl)) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const response = await fetch(resolvedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 502 },
      )
    }

    const finalUrl = response.url

    // Limit HTML size to prevent memory issues (500KB is enough for metadata)
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 2_000_000) {
      // Page is over 2MB — read only first 500KB for metadata
    }
    const reader = response.body?.getReader()
    let html = ''
    const MAX_HTML_BYTES = 500_000
    if (reader) {
      const decoder = new TextDecoder()
      let bytesRead = 0
      while (bytesRead < MAX_HTML_BYTES) {
        const { done, value } = await reader.read()
        if (done) break
        html += decoder.decode(value, { stream: true })
        bytesRead += value.length
      }
      reader.cancel().catch(() => {})
    } else {
      const fullText = await response.text()
      html = fullText.slice(0, MAX_HTML_BYTES)
    }

    // Extract page title
    let title: string | null = null
    const ogTitleMatch = html.match(
      /property="og:title"\s+content="([^"]+)"/i,
    ) || html.match(/content="([^"]+)"\s+property="og:title"/i)
    if (ogTitleMatch) {
      title = ogTitleMatch[1]
    } else {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch) {
        title = titleMatch[1].trim()
      }
    }

    // Extract price
    const price = extractPrice(html)

    // Get hostname
    let hostname = ''
    try {
      hostname = new URL(finalUrl).hostname.replace('www.', '')
    } catch {
      /* skip */
    }

    return NextResponse.json({
      title,
      price: price !== null ? price.toFixed(2) : null,
      hostname,
      resolvedUrl: finalUrl !== url ? finalUrl : undefined,
    })
  } catch (err) {
    console.error('[resolve-url] Error:', err)
    return NextResponse.json(
      { error: 'Failed to resolve URL' },
      { status: 500 },
    )
  }
}
