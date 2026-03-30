import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Steward',
  description: 'Privacy Policy for Steward, your AI concierge that watches the web.',
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
            Effective date: March 6, 2026
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
              When you sign in with Apple or email, we receive:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li><strong className="text-[var(--color-ink)]">Display name</strong> (first and last name) &mdash; only if you choose to share it. Stored on our servers to personalize your experience.</li>
              <li><strong className="text-[var(--color-ink)]">Email address</strong> &mdash; used for account identification only.</li>
            </ul>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mt-3">
              We do not store your passwords or credentials directly. Authentication is handled securely through Apple&apos;s Sign In with Apple service or Supabase Auth.
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

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Apple (authentication & payments)</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Sign In with Apple handles authentication. All subscription payments are processed entirely by Apple through the App Store. We never receive or store your payment information.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              4. Data We Do NOT Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li>We do not collect payment or credit card information</li>
              <li>We do not use analytics SDKs or third-party tracking tools</li>
              <li>We do not serve advertisements</li>
              <li>We do not sell, rent, or share your personal data with third parties for marketing</li>
              <li>We do not track you across other apps or websites</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              5. Data Retention
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Your data is retained as long as your account is active. Watch check results are kept to power price history and insights. If you delete your account, all associated data (profile, watches, activities, and check results) will be permanently removed from our servers within 30 days.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              6. Data Security
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

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              7. Your Rights
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

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Steward is not intended for children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will promptly delete it.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              9. Changes to This Policy
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you through the app or by updating the effective date at the top of this page. Your continued use of Steward after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              10. Contact Us
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
