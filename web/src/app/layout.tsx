import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/providers/auth-provider'
import { SubscriptionProvider } from '@/providers/subscription-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
}

export const metadata: Metadata = {
  title: {
    default: 'Steward AI Concierge',
    template: '%s | Steward',
  },
  description: 'Steward is an AI-powered price tracker that monitors price drops, restocks, restaurant reservations, campsite openings, flight deals, and event tickets. Set up in 30 seconds. Free to start.',
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
    title: 'Steward — AI Price Tracker & Web Monitor',
    description: 'Track price drops, restocks, restaurant reservations, campsites, flights, and event tickets. AI-powered setup in seconds. Free to start.',
    url: 'https://www.joinsteward.app',
    siteName: 'Steward',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Steward — AI Price Tracker & Web Monitor',
    description: 'Track price drops, restocks, restaurant reservations, campsites, flights, and event tickets. Free to start.',
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
  verification: {},
  category: 'technology',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <SubscriptionProvider>
              {children}
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
