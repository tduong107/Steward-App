import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with Steward — contact our support team, report issues, or request features for the AI price tracker.',
  alternates: { canonical: 'https://www.joinsteward.app/support' },
  // OpenGraph + Twitter so a shared "/support" link gets a proper
  // page-titled preview. Image inherits from app/opengraph-image.tsx.
  openGraph: {
    title: 'Support | Steward',
    description: 'Get help with Steward — contact our support team, report issues, or request features.',
    url: 'https://www.joinsteward.app/support',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Support | Steward',
    description: 'Get help with Steward — contact our support team, report issues, or request features.',
  },
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children
}
