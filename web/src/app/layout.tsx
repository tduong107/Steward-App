import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/providers/auth-provider'
import { SubscriptionProvider } from '@/providers/subscription-provider'
import { ThemeProvider } from '@/providers/theme-provider'

export const metadata: Metadata = {
  title: 'Steward — Your AI Concierge',
  description: 'Steward monitors websites for price drops, restocks, and availability changes, then notifies you or acts on your behalf.',
  metadataBase: new URL('https://www.joinsteward.app'),
  openGraph: {
    title: 'Steward — Your AI Concierge',
    description: 'Steward monitors websites for price drops, restocks, and availability changes, then notifies you or acts on your behalf.',
    url: 'https://www.joinsteward.app',
    siteName: 'Steward',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Steward — Your AI Concierge',
    description: 'Steward monitors websites for price drops, restocks, and availability changes, then notifies you or acts on your behalf.',
  },
  robots: {
    index: true,
    follow: true,
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
      </body>
    </html>
  )
}
