import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, category, message } = body

    // Validate
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 })
    }

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message is too long (max 5000 characters)' }, { status: 400 })
    }

    // Store in Supabase
    if (supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { error: dbError } = await supabase.from('support_messages').insert({
        name,
        email,
        category: category || 'general',
        message,
      })

      if (dbError) {
        console.error('Supabase insert error:', dbError)
      }
    }

    // Send email notification via Resend (if configured)
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
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
            subject: `[Steward Support] ${category || 'General'}: ${name}`,
            html: `
              <h2>New Support Message</h2>
              <p><strong>From:</strong> ${name} (${email})</p>
              <p><strong>Category:</strong> ${category || 'General'}</p>
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, '<br>')}</p>
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
