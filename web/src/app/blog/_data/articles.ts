export interface BlogArticle {
  slug: string
  title: string
  description: string
  category: 'comparison' | 'guide'
  icon: string
  publishedAt: string
}

export const articles: BlogArticle[] = [
  {
    slug: 'steward-vs-honey',
    title: 'Steward vs Honey: Beyond Coupon Codes',
    description: 'Honey finds coupons at checkout. Steward tracks prices, restaurants, campsites, flights, and tickets across any website.',
    category: 'comparison',
    icon: '🍯',
    publishedAt: '2026-04-09',
  },
  {
    slug: 'steward-vs-camelcamelcamel',
    title: 'Steward vs CamelCamelCamel: Not Just Amazon',
    description: 'CamelCamelCamel only tracks Amazon. Steward works on any URL — Nike, Best Buy, Target, and beyond shopping entirely.',
    category: 'comparison',
    icon: '🐫',
    publishedAt: '2026-04-09',
  },
  {
    slug: 'best-campsite-tracker',
    title: 'Best Campsite Tracker: Get Yosemite & National Park Sites',
    description: 'How to snag sold-out campsites at Yosemite, Yellowstone, and Big Sur. Steward monitors Recreation.gov cancellations 24/7.',
    category: 'guide',
    icon: '🏕',
    publishedAt: '2026-04-09',
  },
  {
    slug: 'best-restaurant-reservation-tracker',
    title: 'Best Restaurant Reservation Tracker for Hard-to-Book Tables',
    description: 'How to get reservations at Carbone, Don Angie, and other impossible restaurants. Steward monitors Resy cancellations automatically.',
    category: 'guide',
    icon: '🍽',
    publishedAt: '2026-04-09',
  },
]
