import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { AuthProvider } from '@/providers/auth-provider'
import { SubscriptionProvider } from '@/providers/subscription-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { PostHogProvider } from '@/providers/posthog-provider'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

// PERF: `preload: false` so the Geist font binary isn't fetched eagerly
// on every page. The landing page renders body copy in Inter (system
// fallback chain) and headings in Georgia — Geist is only used by
// shadcn-themed app pages (/home/*). When a user hits those pages the
// font fetches on demand; the small flash of system-ui is acceptable.
// `display: 'swap'` (next/font default) also ensures the font swap
// doesn't block first paint anywhere it IS loaded.
const geist = Geist({ subsets: ['latin'], variable: '--font-sans', preload: false });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
}

export const metadata: Metadata = {
  title: {
    default: 'Steward — AI Price Tracker for Deals, Restocks, Reservations & Flights',
    template: '%s | Steward',
  },
  description: 'Steward is an AI-powered price tracker that monitors price drops, restocks, restaurant reservations, campsite openings, flight deals, and event tickets across Amazon, Nike, Resy, Recreation.gov & more. Free to start.',
  keywords: [
    'price tracker',
    'price drop alert',
    'price monitoring',
    'restock alert',
    'restaurant reservation tracker',
    'campsite availability',
    'flight price tracker',
    'event ticket tracker',
    'AI price tracker',
    'web monitoring',
    'price alert app',
    'deal finder',
    'price watch',
    'Steward app',
    'best price tracker app',
    'Amazon price tracker',
    'Nike price tracker',
    'Resy reservation tracker',
    'Recreation.gov campsite tracker',
    'concert ticket restock alert',
  ],
  metadataBase: new URL('https://www.joinsteward.app'),
  openGraph: {
    title: 'Steward — AI Price Tracker for Deals, Restocks, Reservations & Flights',
    description: 'Track price drops, restocks, restaurant reservations, campsites, flights, and event tickets. AI-powered setup in seconds. Free to start.',
    url: 'https://www.joinsteward.app',
    siteName: 'Steward',
    type: 'website',
    locale: 'en_US',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Steward — AI Price Tracker for Deals, Restocks, Reservations & Flights',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Steward — AI Price Tracker for Deals, Restocks, Reservations & Flights',
    description: 'Track price drops, restocks, restaurant reservations, campsites, flights, and event tickets. Free to start.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.joinsteward.app',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  verification: {
    other: { 'msvalidate.01': '8FCE1E38CB4189C472FD8E744C25B4BB' },
  },
  category: 'technology',
}

// Shared offer list used by both SoftwareApplication and
// MobileApplication schemas — keeps pricing in one place so the two
// surfaces can never drift.
const offers = [
  { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD', 'name': 'Free', 'description': '3 trackers, daily checks, push notifications' },
  { '@type': 'Offer', 'price': '4.99', 'priceCurrency': 'USD', 'name': 'Pro', 'description': '7 trackers, 12-hour checks, email & SMS alerts' },
  { '@type': 'Offer', 'price': '9.99', 'priceCurrency': 'USD', 'name': 'Premium', 'description': '15 trackers, 2-hour checks, automated actions, fake deal detection' },
]

// Master JSON-LD `@graph` describing the Steward entity to crawlers.
//
// Why each node is here:
//
// - `WebSite` — the canonical Steward web presence. The `potentialAction`
//   SearchAction tells Google we have an internal search (the blog is
//   query-able via `?q=`) and unlocks the sitelinks search box on the
//   SERP. Even when the search target is modest, AI systems use this
//   block to disambiguate "Steward" from other entities of the same
//   name.
//
// - `SoftwareApplication` — describes the cross-platform product
//   (web + iOS). Lists the three pricing tiers as `Offer`s so AI
//   answers about pricing have authoritative numbers to cite.
//
// - `MobileApplication` — narrower node specifically for the iOS app.
//   `SoftwareApplication` alone is not enough: it doesn't tell crawlers
//   the app is on the App Store, what it costs to download, or which
//   OS version is required. Without this, queries like "best AI
//   shopping assistant iPhone app" can't surface Steward as a mobile
//   app candidate.
//
// - `Organization` — entity for "the company called Steward". `sameAs`
//   anchors the brand to its first-party platform profiles (App Store
//   today; add Twitter / LinkedIn / Crunchbase as those go live) which
//   helps Google's Knowledge Graph and reduces the risk that AI
//   systems conflate us with other Steward-branded products.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      'name': 'Steward',
      'alternateName': 'Steward Concierge',
      'url': 'https://www.joinsteward.app',
      'description': 'AI-powered price tracker that monitors price drops, restocks, restaurant reservations, campsite openings, flight deals, and event tickets.',
      'publisher': { '@id': 'https://www.joinsteward.app/#organization' },
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': 'https://www.joinsteward.app/blog?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.joinsteward.app/#software',
      'name': 'Steward',
      'alternateName': 'Steward AI Concierge',
      'applicationCategory': 'UtilitiesApplication',
      'applicationSubCategory': 'Price Tracker',
      'operatingSystem': 'iOS 17.0, Web',
      'url': 'https://www.joinsteward.app',
      'downloadUrl': 'https://apps.apple.com/us/app/steward-concierge/id6760180137',
      'description': 'AI-powered price tracker that monitors price drops, restocks, restaurant reservations, campsite openings, flight deals, and event tickets across Amazon, Nike, Resy, Recreation.gov and more.',
      'featureList': [
        'Price drop alerts on any URL',
        'Restock alerts (Nike, Best Buy, Target)',
        'Restaurant reservation tracking (Resy, OpenTable)',
        'Campsite availability (Recreation.gov)',
        'Flight fare tracking (Google Flights, Kayak)',
        'Event ticket restock alerts (Ticketmaster)',
        'AI chat for natural-language watch creation',
        'iOS share extension',
        'Push notifications, email, and SMS alerts',
      ],
      'offers': offers,
      'publisher': { '@id': 'https://www.joinsteward.app/#organization' },
    },
    {
      '@type': 'MobileApplication',
      '@id': 'https://www.joinsteward.app/#ios-app',
      'name': 'Steward Concierge',
      'alternateName': 'Steward — AI Price & Deal Tracker',
      'applicationCategory': 'UtilitiesApplication',
      'applicationSubCategory': 'Price Tracker',
      'operatingSystem': 'iOS 17.0',
      'url': 'https://apps.apple.com/us/app/steward-concierge/id6760180137',
      'downloadUrl': 'https://apps.apple.com/us/app/steward-concierge/id6760180137',
      'installUrl': 'https://apps.apple.com/us/app/steward-concierge/id6760180137',
      'description': 'Native iOS app for Steward. Monitor price drops, restocks, restaurant reservations, campsites, flights, and event tickets with AI-assisted setup, push notifications, and a Safari share extension.',
      'screenshot': 'https://www.joinsteward.app/og-image.png',
      'offers': offers,
      'publisher': { '@id': 'https://www.joinsteward.app/#organization' },
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.joinsteward.app/#organization',
      'name': 'Steward',
      'url': 'https://www.joinsteward.app',
      'logo': 'https://www.joinsteward.app/steward-logo.png',
      'description': 'Maker of Steward, the AI-powered concierge app for price drops, restocks, restaurant reservations, campsite openings, flight deals, and event tickets.',
      'contactPoint': {
        '@type': 'ContactPoint',
        'email': 'hello@joinsteward.app',
        'contactType': 'customer support',
      },
      'sameAs': [
        'https://apps.apple.com/us/app/steward-concierge/id6760180137',
      ],
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ fontFamily: 'var(--font-body)' }}>
        <PostHogProvider>
          <ThemeProvider>
            <AuthProvider>
              <SubscriptionProvider>
                {children}
              </SubscriptionProvider>
            </AuthProvider>
          </ThemeProvider>
        </PostHogProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
