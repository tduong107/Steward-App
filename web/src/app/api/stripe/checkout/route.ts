import { NextRequest, NextResponse } from 'next/server'
import { getStripe, getStripePriceId } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getPostHogClient } from '@/lib/posthog-server'

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
      return NextResponse.json({ error: 'Missing tier or billing parameter' }, { status: 400 })
    }

    const priceId = getStripePriceId(tier, billing)
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid tier or billing combination' }, { status: 400 })
    }

    const stripe = getStripe()
    // Use a hardcoded origin to prevent open redirect attacks.
    // An attacker could spoof the Origin header to redirect users to
    // a phishing page after checkout (e.g., Origin: https://evil.com →
    // success_url becomes https://evil.com/home?upgraded=pro).
    const ALLOWED_ORIGINS = [
      'https://www.joinsteward.app',
      'https://joinsteward.app',
      'http://localhost:3000',
    ]
    const requestOrigin = request.headers.get('origin') || ''
    const origin = ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.joinsteward.app')

    // Get user's email and profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_email, subscription_source')
      .eq('id', user.id)
      .single()

    const customerEmail = profile?.notification_email
      || user.email
      || user.user_metadata?.email
      || undefined

    // Check if user already has a Stripe subscription (Pro → Premium upgrade)
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 })
      if (customers.data.length > 0) {
        const customer = customers.data[0]
        // Find their active subscription
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'active',
          limit: 1,
        })

        if (subscriptions.data.length > 0) {
          // UPGRADE existing subscription (prorated)
          const existingSub = subscriptions.data[0]
          const updatedSub = await stripe.subscriptions.update(existingSub.id, {
            items: [{
              id: existingSub.items.data[0].id,
              price: priceId,
            }],
            proration_behavior: 'create_prorations',
            metadata: { user_id: user.id, tier },
          })

          // Update tier in Supabase immediately
          await supabase
            .from('profiles')
            .update({ subscription_tier: tier, subscription_source: 'stripe' })
            .eq('id', user.id)

          console.log(`Subscription upgraded: user=${user.id} to=${tier} sub=${updatedSub.id}`)
          getPostHogClient().capture({ distinctId: user.id, event: 'subscription_checkout_started', properties: { tier, billing, type: 'upgrade' } })
          // Return a redirect URL instead of a Stripe checkout URL
          return NextResponse.json({ url: `${origin}/home?upgraded=${tier}` })
        }
      }
    }

    // NEW subscription — create checkout session
    const sessionParams: Record<string, unknown> = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/home?upgraded=${tier}`,
      cancel_url: `${origin}/home/settings`,
      metadata: { user_id: user.id, tier },
      subscription_data: {
        metadata: { user_id: user.id, tier },
      },
    }

    if (customerEmail) {
      sessionParams.customer_email = customerEmail
    }

    const session = await stripe.checkout.sessions.create(sessionParams as any)
    getPostHogClient().capture({ distinctId: user.id, event: 'subscription_checkout_started', properties: { tier, billing, type: 'new' } })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
