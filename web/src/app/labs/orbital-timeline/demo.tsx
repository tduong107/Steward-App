'use client'

import {
  Package,
  Plane,
  Share2,
  Sparkles,
  Tent,
  Ticket,
  TrendingDown,
  UtensilsCrossed,
} from 'lucide-react'
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline'

// Eight Steward use cases, mirroring the "One app, endless ways to save"
// section on the landing page. Orbital layout here is an alternate
// visual take — click any node to see its description + which related
// use cases light up.
//
// `relatedIds` creates the hover-glow graph — we connect use cases
// that share a user intent (e.g. Price Drops ↔ Restocks both monitor
// products; Restaurant Tables ↔ Event Tickets both snag cancellations).
const timelineData = [
  {
    id: 1,
    title: 'Price Drops',
    date: 'SHOPPING',
    content: 'Set a target price across thousands of retailers. Get pinged the instant it hits. Nike, Amazon, Best Buy and more.',
    category: 'Shopping',
    icon: TrendingDown,
    relatedIds: [3, 6, 7],
    status: 'completed' as const,
    energy: 100,
  },
  {
    id: 2,
    title: 'Restaurant Tables',
    date: 'DINING',
    content: 'Impossible reservation? Steward monitors Resy for cancellations and new openings so you snag the table.',
    category: 'Dining',
    icon: UtensilsCrossed,
    relatedIds: [4, 5],
    status: 'completed' as const,
    energy: 92,
  },
  {
    id: 3,
    title: 'Flight Deals',
    date: 'TRAVEL',
    content: 'Track fares across airlines and routes. Get pinged when prices drop on the trips you actually want to take.',
    category: 'Travel',
    icon: Plane,
    relatedIds: [1, 4],
    status: 'completed' as const,
    energy: 95,
  },
  {
    id: 4,
    title: 'Campsites',
    date: 'TRAVEL',
    content: 'Yosemite, Yellowstone, Big Sur. Snag that cancellation before anyone else via Recreation.gov monitoring.',
    category: 'Travel',
    icon: Tent,
    relatedIds: [2, 3],
    status: 'completed' as const,
    energy: 88,
  },
  {
    id: 5,
    title: 'Event Tickets',
    date: 'ENTERTAINMENT',
    content: 'Sold-out concert? Steward monitors Ticketmaster for face-value drops and new inventory releases.',
    category: 'Entertainment',
    icon: Ticket,
    relatedIds: [2, 6],
    status: 'completed' as const,
    energy: 85,
  },
  {
    id: 6,
    title: 'Restocks',
    date: 'SHOPPING',
    content: 'Limited releases, sold-out sneakers, viral products. Be first in line when they come back. Works on most URLs.',
    category: 'Shopping',
    icon: Package,
    relatedIds: [1, 5, 7],
    status: 'completed' as const,
    energy: 90,
  },
  {
    id: 7,
    title: 'AI Chat Setup',
    date: 'HOW IT WORKS',
    content: 'Just say what you want. Your AI concierge figures out what to track, picks the right retailer, and starts watching.',
    category: 'AI',
    icon: Sparkles,
    relatedIds: [1, 6, 8],
    status: 'completed' as const,
    energy: 100,
  },
  {
    id: 8,
    title: 'Share Extension',
    date: 'HOW IT WORKS',
    content: 'See something in Safari or Chrome you want to track? Tap Share → Steward. Done. Works in most apps.',
    category: 'iOS',
    icon: Share2,
    relatedIds: [7],
    status: 'completed' as const,
    energy: 80,
  },
]

export function OrbitalTimelineLabDemo() {
  return <RadialOrbitalTimeline timelineData={timelineData} />
}
