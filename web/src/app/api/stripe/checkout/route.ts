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

    // Get the best email: profile notification_email → auth email → OAuth email
    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_email')
      .eq('id', user.id)
      .single()

    const customerEmail = profile?.notification_email
      || user.email
      || user.user_metadata?.email
      || undefined

    // If we have the email, pre-fill it. If not, Stripe will ask for it.
    const sessionParams: Record<string, unknown> = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/home?upgraded=${tier}`,
      cancel_url: `${origin}/home/settings`,
      metadata: {
        user_id: user.id,
        tier,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          tier,
        },
      },
    }

    if (customerEmail) {
      sessionParams.customer_email = customerEmail
    }

    const session = await getStripe().checkout.sessions.create(sessionParams as any)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
