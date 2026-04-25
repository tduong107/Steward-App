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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      'name': 'Steward',
      'url': 'https://www.joinsteward.app',
      'description': 'AI-powered price tracker that monitors price drops, restocks, restaurant reservations, campsite openings, flight deals, and event tickets.',
    },
    {
      '@type': 'SoftwareApplication',
      'name': 'Steward',
      'alternateName': 'Steward AI Concierge',
      'applicationCategory': 'UtilitiesApplication',
      'operatingSystem': 'iOS, Web',
      'url': 'https://www.joinsteward.app',
      'downloadUrl': 'https://apps.apple.com/us/app/steward-concierge/id6760180137',
      'description': 'AI-powered price tracker that monitors price drops, restocks, restaurant reservations, campsite openings, flight deals, and event tickets across Amazon, Nike, Resy, Recreation.gov and more.',
      'offers': [
        { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD', 'name': 'Free', 'description': '3 trackers, daily checks, push notifications' },
        { '@type': 'Offer', 'price': '4.99', 'priceCurrency': 'USD', 'name': 'Pro', 'description': '7 trackers, 12-hour checks, email & SMS alerts' },
        { '@type': 'Offer', 'price': '9.99', 'priceCurrency': 'USD', 'name': 'Premium', 'description': '15 trackers, 2-hour checks, automated actions, fake deal detection' },
      ],
    },
    {
      '@type': 'Organization',
      'name': 'Steward',
      'url': 'https://www.joinsteward.app',
      'logo': 'https://www.joinsteward.app/steward-logo.png',
      'contactPoint': {
        '@type': 'ContactPoint',
        'email': 'hello@joinsteward.app',
        'contactType': 'customer support',
      },
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
