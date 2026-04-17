import type { Metadata } from 'next'
import CategoryPageClient from '@/components/blog/category-page-client'
import { articles } from '../_data/articles'

export const metadata: Metadata = {
  title: 'How We Compare — Steward vs Competitors',
  description: 'See how Steward compares to Honey, CamelCamelCamel, and other price trackers. Steward tracks prices, restaurants, campsites, flights, and tickets across any website.',
  alternates: { canonical: 'https://www.joinsteward.app/blog/comparisons' },
}

export default function ComparisonsPage() {
  return (
    <CategoryPageClient
      pillLabel="How We Compare"
      heading={<>Steward vs the <em>competition</em></>}
      subtitle="See how Steward stacks up against popular price trackers and why we go far beyond just shopping."
      accent="#F59E0B"
      accentRGB="245, 158, 11"
      articles={articles.filter(a => a.category === 'comparison')}
    />
  )
}
