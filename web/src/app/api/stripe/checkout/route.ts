import { NextRequest, NextResponse } from 'next/server'
import { getStripe, getStripePriceId } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tier, billing } = (await request.json()) as {
      tier: 'pro' | 'premium'
      billing: 'monthly' | 'yearly'
    }

    if (!tier || !billing) {
      return NextResponse.json(
        { error: 'Missing tier or billing parameter' },
        { status: 400 }
      )
    }

    const priceId = getStripePriceId(tier, billing)

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid tier or billing combination' },
        { status: 400 }
      )
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/settings`,
      metadata: {
        user_id: user.id,
        tier,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
