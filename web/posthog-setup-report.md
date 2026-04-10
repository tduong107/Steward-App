<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Steward web app (Next.js App Router, TypeScript). PostHog is initialized client-side via `instrumentation-client.ts` (the Next.js 15.3+ recommended approach), proxied through the app via rewrites in `next.config.ts`, and available server-side via a singleton `posthog-node` client. Users are identified on sign-in and reset on sign-out. 15 events are tracked across 9 files covering the full user lifecycle: authentication, watch management, subscription conversion, and churn.

| Event | Description | File |
|---|---|---|
| `user_signed_in` | User successfully signs in with phone + password | `src/app/(auth)/login/page.tsx` |
| `oauth_sign_in_initiated` | User clicks Google or Apple sign-in button on the login page | `src/app/(auth)/login/page.tsx` |
| `user_signed_up` | User completes phone verification and creates an account | `src/app/(auth)/signup/page.tsx` |
| `oauth_sign_up_initiated` | User clicks Google or Apple button on the signup page | `src/app/(auth)/signup/page.tsx` |
| `upgrade_banner_clicked` | User clicks the watch-limit upgrade banner on the dashboard | `src/app/home/page.tsx` |
| `watch_triggered_cta_clicked` | User clicks the CTA on a triggered watch card (Open & Buy, Open & Reserve, etc.) | `src/app/home/page.tsx` |
| `watch_deleted` | User deletes a watch from the watch detail page | `src/app/home/watch/[id]/page.tsx` |
| `watch_paused` | User pauses monitoring on a watch | `src/app/home/watch/[id]/page.tsx` |
| `watch_resumed` | User resumes monitoring on a paused watch | `src/app/home/watch/[id]/page.tsx` |
| `watch_shared` | User generates a share link for a watch | `src/app/home/watch/[id]/page.tsx` |
| `paywall_viewed` | User opens the paywall / upgrade dialog | `src/components/paywall-dialog.tsx` |
| `subscription_upgrade_started` | User clicks Subscribe on a paid tier in the paywall dialog | `src/components/paywall-dialog.tsx` |
| `subscription_checkout_started` | Server: Stripe checkout session created or subscription upgraded | `src/app/api/stripe/checkout/route.ts` |
| `subscription_activated` | Server: Stripe checkout.session.completed — user's subscription is now active | `src/app/api/stripe/webhook/route.ts` |
| `subscription_cancelled` | Server: Stripe customer.subscription.deleted — user cancelled and was downgraded to free | `src/app/api/stripe/webhook/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/374892/dashboard/1453072
- **Subscription upgrade funnel** (paywall viewed → upgrade started → activated): https://us.posthog.com/project/374892/insights/mJNljBuU
- **New signups & daily active sign-ins**: https://us.posthog.com/project/374892/insights/l06pmXU8
- **Watch engagement actions** (deleted, paused, resumed, shared): https://us.posthog.com/project/374892/insights/mHJdFqxZ
- **Subscription activations vs cancellations**: https://us.posthog.com/project/374892/insights/5pU0MIAv
- **Triggered watch CTA clicks by action type**: https://us.posthog.com/project/374892/insights/NYaJRcrB

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
