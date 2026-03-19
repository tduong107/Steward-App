import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const tier = session.metadata?.tier

        if (userId && tier) {
          // TODO: Update user's subscription tier in Supabase
          // e.g. await supabaseAdmin.from('profiles').update({ subscription_tier: tier }).eq('id', userId)
          console.log(`Checkout completed: user=${userId} tier=${tier} session=${session.id}`)
        } else {
          console.warn('Checkout session missing user_id or tier metadata:', session.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // TODO: Look up user by Stripe customer ID and reset to free tier
        // e.g. await supabaseAdmin.from('profiles').update({ subscription_tier: 'free' }).eq('stripe_customer_id', customerId)
        console.log(`Subscription deleted: customer=${customerId} subscription=${subscription.id}`)
        break
      }

      default:
        // Unhandled event type — no action needed
        break
    }
  } catch (err) {
    console.error('Error processing webhook event:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
