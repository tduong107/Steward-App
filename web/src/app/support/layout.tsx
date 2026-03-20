import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with Steward. Submit a question, report a bug, or request a feature.',
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children
}
