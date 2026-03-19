import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/providers/auth-provider'
import { SubscriptionProvider } from '@/providers/subscription-provider'
import { ThemeProvider } from '@/providers/theme-provider'

export const metadata: Metadata = {
  title: 'Steward — Watch the web for you',
  description: 'Automatically monitor websites for price drops, restocks, and availability changes.',
  icons: {
    icon: '/favicon.ico',
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
