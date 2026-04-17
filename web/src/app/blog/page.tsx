import type { Metadata } from 'next'
import ResourcesClient from '@/components/blog/resources-client'

export const metadata: Metadata = {
  title: 'Resources — Comparisons, Guides & Insights',
  description: 'Steward resources: see how we compare to Honey and CamelCamelCamel, read guides on tracking campsites and restaurants, and get insights on saving money.',
  alternates: { canonical: 'https://www.joinsteward.app/blog' },
  openGraph: {
    title: 'Steward Resources — Comparisons, Guides & Insights',
    description: 'Comparisons, guides, and tips on tracking prices, restaurants, campsites, flights, and event tickets with Steward.',
    url: 'https://www.joinsteward.app/blog',
    type: 'website',
  },
}

export default function BlogIndexPage() {
  return <ResourcesClient />
}
