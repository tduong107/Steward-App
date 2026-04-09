import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Lazy-initialize admin client (service role key may not be available at build time)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

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
          // Update user's subscription tier in Supabase
          const { error } = await getSupabaseAdmin()
            .from('profiles')
            .update({ subscription_tier: tier, subscription_source: 'stripe' })
            .eq('id', userId)

          if (error) {
            console.error(`Failed to update tier for user ${userId}:`, error.message)
          } else {
            console.log(`Checkout completed: user=${userId} tier=${tier} session=${session.id}`)
          }
        } else {
          console.warn('Checkout session missing user_id or tier metadata:', session.id)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id

        if (!userId) break

        if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
          // Active subscription — update tier (handles upgrades/downgrades between tiers)
          const tier = subscription.metadata?.tier
          if (tier) {
            await getSupabaseAdmin()
              .from('profiles')
              .update({ subscription_tier: tier, subscription_source: 'stripe' })
              .eq('id', userId)
            console.log(`Subscription updated: user=${userId} tier=${tier}`)
          }
        } else if (subscription.cancel_at_period_end) {
          // User cancelled but subscription is still active until end of period
          // Don't downgrade yet — they paid for this period
          const cancelAt = subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : 'end of period'
          console.log(`Subscription cancelling at ${cancelAt}: user=${userId}`)
        } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          // Payment issues — log but don't downgrade yet (Stripe will retry)
          console.log(`Subscription ${subscription.status}: user=${userId}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        if (subscriptionId) {
          // Retrieve the subscription to get user_id from metadata
          try {
            const sub = await getStripe().subscriptions.retrieve(subscriptionId)
            const userId = sub.metadata?.user_id
            if (userId) {
              console.log(`Payment failed for user=${userId}, subscription=${subscriptionId}`)
              // Don't immediately downgrade — Stripe will retry. Just log it.
              // After all retries fail, Stripe will cancel the subscription and
              // trigger customer.subscription.deleted which handles the downgrade.
            }
          } catch { /* subscription may not exist */ }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id

        if (userId) {
          // Reset to free tier when subscription is cancelled
          const { error } = await getSupabaseAdmin()
            .from('profiles')
            .update({ subscription_tier: 'free', subscription_source: 'none' })
            .eq('id', userId)

          if (error) {
            console.error(`Failed to reset tier for user ${userId}:`, error.message)
          } else {
            console.log(`Subscription deleted: user=${userId} subscription=${subscription.id}`)
          }
        } else {
          // Fallback: look up by Stripe customer ID
          const customerId = subscription.customer as string
          console.log(`Subscription deleted for customer ${customerId}, but no user_id in metadata`)
        }
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
