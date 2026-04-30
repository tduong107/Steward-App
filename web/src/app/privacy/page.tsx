import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Steward — how we handle your data, protect your privacy, and keep your price tracking information secure.',
  alternates: { canonical: 'https://www.joinsteward.app/privacy' },
  // OpenGraph + Twitter so a shared "/privacy" link gets a proper
  // page-titled preview rather than falling back to the layout-level
  // generic landing-page tags. Image is inherited from the
  // app/opengraph-image.tsx convention file (no override needed).
  openGraph: {
    title: 'Privacy Policy | Steward',
    description: 'How Steward handles your data, protects your privacy, and keeps your tracking information secure.',
    url: 'https://www.joinsteward.app/privacy',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Steward',
    description: 'How Steward handles your data, protects your privacy, and keeps your tracking information secure.',
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-ink)]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/steward-logo.png"
              alt="Steward"
              width={30}
              height={30}
              className="rounded-lg"
            />
            <span className="text-lg font-semibold font-[var(--font-serif)] text-[var(--color-accent)]">
              Steward
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-[var(--color-ink-mid)] hover:text-[var(--color-ink)] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <header className="mb-12">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-accent)] mb-3">
            Legal
          </p>
          <h1 className="text-3xl md:text-4xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-[var(--color-ink-light)]">
            Effective date: April 13, 2026
          </p>
        </header>

        <div className="prose-steward space-y-8">
          <p className="text-[var(--color-ink-mid)] leading-relaxed">
            Steward (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the app&rdquo;) is an application that helps you monitor websites for changes like price drops, restocks, and availability. This Privacy Policy explains what data we collect, how we use it, and your rights.
          </p>

          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              1. Data We Collect
            </h2>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Account information</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              When you create an account, we receive:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li><strong className="text-[var(--color-ink)]">Display name</strong> (first and last name) &mdash; only if you choose to share it. Stored on our servers to personalize your experience.</li>
              <li><strong className="text-[var(--color-ink)]">Phone number</strong> &mdash; if you sign up with phone + password, we store your number to authenticate you and, with your opt-in, to send you SMS alerts when your watches trigger. See Section 4 (SMS / Text Messaging) below.</li>
              <li><strong className="text-[var(--color-ink)]">Email address</strong> &mdash; if you sign in with Apple or Google, provided by the identity provider and used only for account identification.</li>
              <li><strong className="text-[var(--color-ink)]">SMS consent record</strong> &mdash; the timestamp and disclosure text you agreed to when opting into SMS alerts. Kept as an audit trail for carrier compliance.</li>
            </ul>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mt-3">
              We do not store your passwords in the clear. Authentication is handled by Supabase Auth (phone + password), Sign In with Apple, or Google Sign-In.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Watch data</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              When you create a watch, we store:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li>The URL of the web page you want to monitor</li>
              <li>Your watch condition (e.g., &ldquo;price drops below $50&rdquo;)</li>
              <li>Watch name, emoji, action preferences, and check frequency</li>
              <li>Product images fetched from the watched URL (og:image metadata)</li>
            </ul>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Push notification tokens</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              If you enable push notifications, we store your device&apos;s push token linked to your account so we can send you alerts when your watches trigger.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Photos you share</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              If you attach a screenshot or photo in the Steward AI chat, the image is compressed and sent to our server for AI analysis. Photos are processed in real-time and are <strong className="text-[var(--color-ink)]">not permanently stored</strong> on our servers.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Activity log</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              We record in-app events such as watches created, alerts triggered, and actions completed. This powers the Activity tab in the app.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">App preferences</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Settings like dark mode and default check frequency are stored locally on your device only.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              2. How We Use Your Data
            </h2>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-deep)]">
                    <th className="text-left px-5 py-3 font-semibold text-[var(--color-ink)]">Data</th>
                    <th className="text-left px-5 py-3 font-semibold text-[var(--color-ink)]">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--color-ink-mid)]">
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-5 py-3">Name & email</td>
                    <td className="px-5 py-3">Account identification and personalization</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-5 py-3">Watch URLs & conditions</td>
                    <td className="px-5 py-3">Automatically checking web pages for changes on your behalf</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-5 py-3">Push notification token</td>
                    <td className="px-5 py-3">Sending you alerts when a watch triggers</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-5 py-3">Chat messages & photos</td>
                    <td className="px-5 py-3">Powering the AI assistant to help you set up and manage watches</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3">Activity log</td>
                    <td className="px-5 py-3">Showing you a history of watch checks and actions</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mt-4">
              We do <strong className="text-[var(--color-ink)]">not</strong> use your data for advertising, user profiling, or cross-app tracking.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              3. Third-Party Services
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-4">
              We use the following third-party services to operate Steward:
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Supabase (backend infrastructure)</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Your account data, watches, and activity history are stored on{' '}
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Supabase</a>{' '}
              servers. Supabase provides database hosting, authentication, and serverless functions. Data is stored in the United States.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Anthropic (AI processing)</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              When you use the Steward AI chat or when a watch check runs, text data (your messages, web page content up to 4,000 characters, and any attached photos) is sent to{' '}
              <a href="https://www.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Anthropic&apos;s</a>{' '}
              Claude AI for processing. Anthropic processes this data to generate responses and does not use it to train their models. See{' '}
              <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Anthropic&apos;s Privacy Policy</a>.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Serper (product search)</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              When you share a product screenshot in chat, a search query may be sent to{' '}
              <a href="https://serper.dev" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Serper.dev</a>{' '}
              to find matching product listings. Only the product search query is sent &mdash; no personal information.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Apple &amp; Google (authentication)</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Sign In with Apple and Google Sign-In handle authentication when you choose those options. Your Apple ID / Google credentials are never shared with us.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Payments (Apple In-App Purchase &amp; Stripe)</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Subscriptions purchased from the iOS app are processed entirely by Apple through the App Store. Subscriptions purchased from the web app (joinsteward.app) are processed by{' '}
              <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Stripe</a>. In both cases we never receive or store your full card details &mdash; we only receive a transaction identifier, subscription status, and the last four digits of the card (Stripe only) for billing support.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Twilio (SMS delivery)</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              If you opt in to SMS alerts, we transmit your phone number and the text of each message to{' '}
              <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Twilio</a>{' '}
              solely so they can deliver the message to your wireless carrier. Twilio is a processor; we do not use Twilio for marketing, profiling, or any purpose other than message delivery.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Product analytics (web)</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              The web app (joinsteward.app) uses{' '}
              <a href="https://posthog.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">PostHog</a>{' '}and{' '}
              <a href="https://vercel.com/analytics" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Vercel Analytics</a>{' '}
              to measure aggregate product usage &mdash; page views, clicks, and conversion funnels &mdash; so we can improve the app. These tools may record your user ID, coarse geolocation (country/region), and device type. We do not use them for advertising, cross-site tracking, or selling data to third parties. The iOS app does not use these tools.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              4. SMS / Text Messaging
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              If you sign up with your phone number and affirmatively opt in at
              the point of signup, Steward may send you recurring automated
              text messages to the number you provided.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Types of messages you&apos;ll receive</h3>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li><strong className="text-[var(--color-ink)]">Transactional</strong> &mdash; one-time verification codes (OTP) and password-reset codes. These are required to use the service and cannot be opted out of.</li>
              <li><strong className="text-[var(--color-ink)]">Alerts</strong> &mdash; price-drop, restock, and watch-triggered notifications based on the watches you create. These require your explicit opt-in and can be stopped at any time.</li>
            </ul>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Opt-in</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              You opt in to alert messages by checking the SMS consent box on
              the signup screen. Consent is <strong className="text-[var(--color-ink)]">not a condition of purchase</strong> or of using Steward &mdash; you can use Apple or Google sign-in and the in-app / push notification channels instead.
              We record the timestamp and the exact disclosure text you
              agreed to as an audit trail.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Frequency &amp; cost</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Message frequency varies based on how many watches you&apos;ve
              created and how often their conditions are met. Message and
              data rates may apply from your wireless carrier. Steward does
              not charge you for SMS.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Opt-out and help</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              You can opt out of alert messages at any time by replying{' '}
              <strong className="text-[var(--color-ink)]">STOP</strong> to any Steward text message, or by turning off SMS alerts in the app&apos;s Settings screen. For help, reply{' '}
              <strong className="text-[var(--color-ink)]">HELP</strong> or email{' '}
              <a href="mailto:hello@joinsteward.app" className="text-[var(--color-accent)] hover:underline">hello@joinsteward.app</a>.
              After you reply STOP you will receive one confirmation message and no further alerts. You may re-opt-in at any time by re-enabling SMS alerts in Settings.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Sharing of SMS data</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              <strong className="text-[var(--color-ink)]">
                No mobile information will be shared with third parties or
                affiliates for marketing or promotional purposes. All
                categories of personal information exclude text messaging
                originator opt-in data and consent; this information will
                not be shared with any third parties or affiliates.
              </strong>{' '}
              Phone numbers and the content of alert messages are transmitted
              only to our SMS delivery provider (Twilio) solely to deliver
              the message to your carrier.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              5. Data We Do NOT Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li>We do not store full credit card numbers &mdash; payments are handled entirely by Apple or Stripe</li>
              <li>We do not serve advertisements</li>
              <li>We do not sell, rent, or share your personal data with third parties for marketing</li>
              <li>We do not track you across other apps or websites</li>
              <li>We do not use advertising SDKs, ad networks, or third-party ad trackers</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              6. Data Retention
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Your data is retained as long as your account is active. Watch check results are kept to power price history and insights. If you delete your account, all associated data (profile, watches, activities, and check results) will be permanently removed from our servers within 30 days.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              7. Data Security
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              We protect your data using:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li>HTTPS encryption for all data in transit</li>
              <li>Supabase Row Level Security ensuring users can only access their own data</li>
              <li>API keys and secrets stored as server-side environment variables, never in the app binary</li>
              <li>Rate limiting on all server endpoints to prevent abuse</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              8. Your Rights
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li><strong className="text-[var(--color-ink)]">Access</strong> your data &mdash; all your watches, activity, and profile are visible in the app</li>
              <li><strong className="text-[var(--color-ink)]">Delete</strong> your data &mdash; contact us at the email below and we will delete your account and all associated data</li>
              <li><strong className="text-[var(--color-ink)]">Revoke notification permissions</strong> &mdash; disable push notifications at any time in your device settings</li>
              <li><strong className="text-[var(--color-ink)]">Revoke Apple Sign In</strong> &mdash; go to Settings &rarr; Apple ID &rarr; Sign-In & Security &rarr; Sign in with Apple to stop using your Apple ID with Steward</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              9. Children&apos;s Privacy
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Steward is not intended for children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will promptly delete it.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you through the app or by updating the effective date at the top of this page. Your continued use of Steward after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              11. Contact Us
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-4">
              If you have questions about this Privacy Policy or want to request data deletion, contact us at:
            </p>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-4">
              <p className="text-[var(--color-ink)]">
                <strong>Email:</strong>{' '}
                <a href="mailto:hello@joinsteward.app" className="text-[var(--color-accent)] hover:underline">
                  hello@joinsteward.app
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[var(--color-border)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[var(--color-ink-light)]">
              &copy; {new Date().getFullYear()} Steward. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-[var(--color-ink-light)]">
              <Link href="/terms" className="hover:text-[var(--color-ink)] transition-colors">Terms of Service</Link>
              <Link href="/" className="hover:text-[var(--color-ink)] transition-colors">Home</Link>
            </div>
          </div>
        </footer>
      </article>
    </div>
  )
}
