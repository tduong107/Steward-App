import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ─── HTML escaping to prevent XSS in email body ─────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ─── Simple in-memory rate limiter (per IP, 5 requests per minute) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const clientIP =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, email, category, message } = body

    // Validate
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 })
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid input types' }, { status: 400 })
    }

    if (!email.includes('@') || email.length > 254) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    if (name.length > 200) {
      return NextResponse.json({ error: 'Name is too long' }, { status: 400 })
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message is too long (max 5000 characters)' }, { status: 400 })
    }

    // Sanitize category to a known allowlist
    const allowedCategories = ['general', 'bug', 'feature', 'billing', 'account', 'other']
    const safeCategory = allowedCategories.includes(category) ? category : 'general'

    // Store in Supabase
    if (supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { error: dbError } = await supabase.from('support_messages').insert({
        name: name.slice(0, 200),
        email: email.slice(0, 254),
        category: safeCategory,
        message: message.slice(0, 5000),
      })

      if (dbError) {
        console.error('Supabase insert error:', dbError)
      }
    }

    // Send email notification via Resend (if configured)
    // ALL user-provided values are HTML-escaped to prevent XSS in the email client
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const safeName = escapeHtml(name.slice(0, 200))
      const safeEmail = escapeHtml(email.slice(0, 254))
      const safeCat = escapeHtml(safeCategory)
      const safeMessage = escapeHtml(message.slice(0, 5000)).replace(/\n/g, '<br>')

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Steward Support <onboarding@resend.dev>',
            to: 'steward.app.privacy@gmail.com',
            subject: `[Steward Support] ${safeCat}: ${safeName}`,
            html: `
              <h2>New Support Message</h2>
              <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
              <p><strong>Category:</strong> ${safeCat}</p>
              <p><strong>Message:</strong></p>
              <p>${safeMessage}</p>
              <hr>
              <p style="color: #666; font-size: 12px;">Sent from joinsteward.app/support</p>
            `,
          }),
        })
      } catch (emailError) {
        console.error('Email send error:', emailError)
        // Don't fail the request if email fails - message is saved in DB
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
