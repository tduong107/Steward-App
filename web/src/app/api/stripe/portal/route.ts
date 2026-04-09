import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stripe = getStripe()
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

    // Get email from multiple sources (phone-only users may not have user.email)
    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_email')
      .eq('id', user.id)
      .single()

    const email = profile?.notification_email
      || user.email
      || user.user_metadata?.email

    if (!email) {
      return NextResponse.json(
        { error: 'No email associated with your account. Please add an email in Settings to manage your subscription.' },
        { status: 404 }
      )
    }

    // Find the Stripe customer by email
    const customers = await stripe.customers.list({ email, limit: 1 })

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: 'No subscription found. You are on the Free plan.' },
        { status: 404 }
      )
    }

    const customer = customers.data[0]

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${origin}/home/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe portal error:', err)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
