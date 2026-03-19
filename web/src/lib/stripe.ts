import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
    })
  }
  return _stripe
}

export function getStripePriceId(tier: 'pro' | 'premium', billing: 'monthly' | 'yearly'): string {
  const map: Record<string, string | undefined> = {
    'pro-monthly': process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    'pro-yearly': process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    'premium-monthly': process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    'premium-yearly': process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
  }
  return map[`${tier}-${billing}`] || ''
}
