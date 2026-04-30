import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Steward — the AI-powered price tracker and web monitoring concierge.',
  alternates: { canonical: 'https://www.joinsteward.app/terms' },
  // OpenGraph + Twitter so a shared "/terms" link gets a proper
  // page-titled preview. Image inherits from app/opengraph-image.tsx.
  openGraph: {
    title: 'Terms of Service | Steward',
    description: 'Terms of Service for Steward — the AI-powered price tracker and web monitoring concierge.',
    url: 'https://www.joinsteward.app/terms',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Steward',
    description: 'Terms of Service for Steward — the AI-powered price tracker and web monitoring concierge.',
  },
}

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-sm text-[var(--color-ink-light)]">
            Effective date: March 6, 2026
          </p>
        </header>

        <div className="prose-steward space-y-8">
          <p className="text-[var(--color-ink-mid)] leading-relaxed">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Steward application (&ldquo;Steward&rdquo;, &ldquo;the app&rdquo;, &ldquo;we&rdquo;, or &ldquo;our&rdquo;). By downloading, installing, or using Steward, you agree to be bound by these Terms. If you do not agree, do not use the app.
          </p>

          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              1. Description of Service
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              Steward is a website monitoring application that allows you to set up automated &ldquo;watches&rdquo; on web pages. The app periodically checks those pages for changes based on conditions you define (such as price drops, restocks, or availability changes) and notifies you when conditions are met.
            </p>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Steward also provides an AI-powered assistant to help you set up and manage watches, price tracking with savings insights, and the ability to share watches with others.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              2. Account & Eligibility
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li>You must be at least 13 years old to use Steward.</li>
              <li>You sign in using Apple&apos;s Sign In with Apple service or email/password. You are responsible for maintaining the security of your account.</li>
              <li>You may only create one Steward account per identity.</li>
              <li>You agree to provide accurate information and to use the app in compliance with all applicable laws.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              3. Subscriptions & Payments
            </h2>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-4 mb-2">Free tier</h3>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Steward offers a free tier that includes up to 3 watches with daily check frequency and push notifications.
            </p>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Paid subscriptions</h3>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-deep)]">
                    <th className="text-left px-5 py-3 font-semibold text-[var(--color-ink)]">Plan</th>
                    <th className="text-left px-5 py-3 font-semibold text-[var(--color-ink)]">Monthly</th>
                    <th className="text-left px-5 py-3 font-semibold text-[var(--color-ink)]">Yearly</th>
                    <th className="text-left px-5 py-3 font-semibold text-[var(--color-ink)]">Includes</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--color-ink-mid)]">
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-5 py-3 font-medium text-[var(--color-ink)]">Steward Pro</td>
                    <td className="px-5 py-3">$4.99/mo</td>
                    <td className="px-5 py-3">$39.99/yr</td>
                    <td className="px-5 py-3">Up to 7 watches, checks every 12 hours, price insights</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-medium text-[var(--color-ink)]">Steward Premium</td>
                    <td className="px-5 py-3">$9.99/mo</td>
                    <td className="px-5 py-3">$79.99/yr</td>
                    <td className="px-5 py-3">Up to 15 watches, checks every 2 hours, auto-execute actions, everything in Pro</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-base font-semibold text-[var(--color-ink)] mt-6 mb-2">Billing terms</h3>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li>All subscriptions are billed through Apple&apos;s App Store or Stripe. We do not process payments directly on the mobile app.</li>
              <li>Subscriptions <strong className="text-[var(--color-ink)]">auto-renew</strong> unless you cancel at least 24 hours before the end of the current billing period.</li>
              <li>You can manage or cancel your subscription at any time in <strong className="text-[var(--color-ink)]">Settings &rarr; Apple ID &rarr; Subscriptions</strong> on your device, or through your account settings on the web.</li>
              <li>Refunds are handled by Apple in accordance with their{' '}
                <a href="https://support.apple.com/en-us/HT204084" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">refund policy</a>.
              </li>
              <li>Prices may change. If we change pricing, we will notify you in advance and any price change will take effect at the start of your next billing period.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              4. Acceptable Use
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              You agree <strong className="text-[var(--color-ink)]">not</strong> to use Steward to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li>Monitor websites in violation of their terms of service or in any way that is illegal</li>
              <li>Scrape, harvest, or collect data from websites at a volume or frequency that constitutes abuse</li>
              <li>Attempt to gain unauthorized access to our servers, other users&apos; accounts, or third-party systems</li>
              <li>Use the AI assistant to generate harmful, abusive, or illegal content</li>
              <li>Reverse-engineer, decompile, or attempt to extract the source code of the app or its backend services</li>
              <li>Resell, redistribute, or commercially exploit the app or its features without our written consent</li>
              <li>Circumvent any rate limits, subscription restrictions, or security measures</li>
            </ul>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mt-3">
              We reserve the right to suspend or terminate your account if you violate these terms.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              5. AI-Powered Features
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              Steward uses artificial intelligence (powered by Anthropic&apos;s Claude) to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li>Help you set up watches through natural language conversation</li>
              <li>Analyze web page content to determine if your watch conditions are met</li>
              <li>Identify products from screenshots you share</li>
              <li>Evaluate price trends and provide deal insights</li>
            </ul>
            <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-4">
              <p className="text-[var(--color-ink-mid)] leading-relaxed">
                AI features are provided on a best-effort basis. The AI may occasionally produce inaccurate results, miss changes, or misinterpret page content. <strong className="text-[var(--color-ink)]">You should not rely solely on Steward for time-critical or high-value purchasing decisions.</strong> We are not responsible for missed alerts, incorrect evaluations, or any financial loss resulting from AI-generated analysis.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              6. Website Monitoring
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              Steward checks websites on your behalf by fetching publicly available web page content. We make reasonable efforts to respect website terms of service and use standard HTTP requests with a clearly identified user agent.
            </p>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">However:</p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li>Some websites may block or restrict automated access, which may prevent watches from working on those sites.</li>
              <li>We do not guarantee that every watch will successfully detect every change.</li>
              <li>Website owners may change their page structure at any time, which can affect watch accuracy.</li>
              <li>Check frequency depends on your subscription tier and is not guaranteed to be precise to the minute.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              7. Shared Watches
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              Steward allows you to share watches with other users via shareable links. When you share a watch:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li>A snapshot of the watch details (name, URL, condition, and action) is stored on our servers with a unique share code.</li>
              <li>Anyone with the share link can view the watch details and add it to their own account.</li>
              <li>Share links expire after 30 days.</li>
              <li>You are responsible for only sharing watches for URLs you have the right to monitor.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              8. Intellectual Property
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              Steward, including its design, code, AI prompts, and brand assets, is owned by us and protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the app for personal, non-commercial purposes in accordance with these Terms.
            </p>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              Content you create within the app (watch configurations, chat messages) remains yours. By using the app, you grant us a limited license to process this content as necessary to provide the service.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              9. Disclaimer of Warranties
            </h2>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-4">
              <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
                Steward is provided <strong className="text-[var(--color-ink)]">&ldquo;as is&rdquo;</strong> and <strong className="text-[var(--color-ink)]">&ldquo;as available&rdquo;</strong> without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
              <p className="text-[var(--color-ink-mid)] leading-relaxed">
                We do not warrant that the app will be uninterrupted, error-free, or that all website changes will be detected. We do not warrant the accuracy of AI-generated content, price tracking, or deal analysis.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              10. Limitation of Liability
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-ink-mid)]">
              <li>Loss of profits or revenue</li>
              <li>Missed purchasing opportunities or price changes</li>
              <li>Inaccurate AI analysis or recommendations</li>
              <li>Unauthorized access to your account due to your failure to secure your credentials</li>
              <li>Service interruptions or downtime</li>
            </ul>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mt-3">
              Our total liability for any claim arising from or related to these Terms or your use of the app shall not exceed the amount you paid us in subscription fees during the 12 months preceding the claim, or $50, whichever is greater.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              11. Termination
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-3">
              You may stop using Steward at any time by deleting the app and cancelling any active subscription through Apple or your account settings.
            </p>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              We may suspend or terminate your access to Steward at any time, with or without cause, including for violation of these Terms. Upon termination, your right to use the app ceases immediately. We may delete your account data in accordance with our{' '}
              <Link href="/privacy" className="text-[var(--color-accent)] hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              12. Changes to These Terms
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              We may update these Terms from time to time. If we make material changes, we will notify you through the app or by updating the effective date above. Your continued use of Steward after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              13. Governing Law
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of the United States. Any disputes arising from these Terms or your use of Steward shall be resolved in the courts of competent jurisdiction.
            </p>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-xl font-bold font-[var(--font-serif)] text-[var(--color-ink)] mb-4">
              14. Contact Us
            </h2>
            <p className="text-[var(--color-ink-mid)] leading-relaxed mb-4">
              If you have questions about these Terms, contact us at:
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
              <Link href="/privacy" className="hover:text-[var(--color-ink)] transition-colors">Privacy Policy</Link>
              <Link href="/" className="hover:text-[var(--color-ink)] transition-colors">Home</Link>
            </div>
          </div>
        </footer>
      </article>
    </div>
  )
}
