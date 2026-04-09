import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with Steward — contact our support team, report issues, or request features for the AI price tracker.',
  alternates: { canonical: 'https://www.joinsteward.app/support' },
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children
}
