import type { Metadata } from 'next'
import CategoryPageClient from '@/components/blog/category-page-client'

export const metadata: Metadata = {
  title: 'Insights — Tips, Trends & Product Updates',
  description: 'Tips on saving money, tracking strategies, product updates, and behind-the-scenes looks at how Steward works.',
  alternates: { canonical: 'https://www.joinsteward.app/blog/insights' },
}

export default function InsightsPage() {
  return (
    <CategoryPageClient
      pillLabel="Insights"
      heading={<>Tips, trends &amp; <em>updates</em></>}
      subtitle="Behind-the-scenes looks at how Steward works, saving strategies, and product updates."
      accent="#A882FF"
      accentRGB="168, 130, 255"
      // No articles yet — falls back to the "coming soon" state
      articles={[]}
      comingSoonTitle="Coming soon"
      comingSoonBody="We're working on articles about saving money, tracking strategies, product updates, and behind-the-scenes looks at how Steward monitors the web for you."
      comingSoonIcon="💡"
    />
  )
}
