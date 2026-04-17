import type { Metadata } from 'next'
import CategoryPageClient from '@/components/blog/category-page-client'
import { articles } from '../_data/articles'

export const metadata: Metadata = {
  title: 'Guides — Campsites, Restaurants, Flights & More',
  description: 'Step-by-step guides on tracking campsite availability, restaurant reservations, flight fares, and event tickets with Steward.',
  alternates: { canonical: 'https://www.joinsteward.app/blog/guides' },
}

export default function GuidesPage() {
  return (
    <CategoryPageClient
      pillLabel="Guides"
      heading={<>How to track <em>anything</em></>}
      subtitle="Step-by-step guides on using Steward to track campsites, restaurants, flights, tickets, and more."
      accent="#6EE7B7"
      accentRGB="110, 231, 183"
      articles={articles.filter(a => a.category === 'guide')}
    />
  )
}
