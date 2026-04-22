// Shared data for the Steward hero video. Mirrors the 8 "ways to save"
// use cases from web/src/app/labs/orbital-timeline/demo.tsx, but with
// tighter narration-friendly copy.

export type UseCase = {
  id: number
  title: string
  category: string
  narration: string // short, spoken-style caption (~1 sentence)
  color: string // hex accent for this category
  relatedIds: number[]
}

export const USE_CASES: UseCase[] = [
  {
    id: 1,
    title: 'Price Drops',
    category: 'SHOPPING',
    narration: 'Set a target price. Get pinged the instant it hits.',
    color: '#06b6d4',
    relatedIds: [3, 6, 7],
  },
  {
    id: 2,
    title: 'Restaurant Tables',
    category: 'DINING',
    narration: 'Monitor Resy for cancellations and snag the table.',
    color: '#f59e0b',
    relatedIds: [4, 5],
  },
  {
    id: 3,
    title: 'Flight Deals',
    category: 'TRAVEL',
    narration: 'Track fares on the trips you actually want to take.',
    color: '#8b5cf6',
    relatedIds: [1, 4],
  },
  {
    id: 4,
    title: 'Campsites',
    category: 'TRAVEL',
    narration: 'Yosemite. Yellowstone. The second a cancellation drops.',
    color: '#8b5cf6',
    relatedIds: [2, 3],
  },
  {
    id: 5,
    title: 'Event Tickets',
    category: 'ENTERTAINMENT',
    narration: 'Sold-out concert? Wait for face-value inventory to reopen.',
    color: '#ec4899',
    relatedIds: [2, 6],
  },
  {
    id: 6,
    title: 'Restocks',
    category: 'SHOPPING',
    narration: 'Limited drops. Sold-out sneakers. Be first in line.',
    color: '#06b6d4',
    relatedIds: [1, 5, 7],
  },
  {
    id: 7,
    title: 'AI Chat',
    category: 'HOW IT WORKS',
    narration: 'Just say what you want. Your concierge handles the rest.',
    color: '#10b981',
    relatedIds: [1, 6, 8],
  },
  {
    id: 8,
    title: 'Share Extension',
    category: 'HOW IT WORKS',
    narration: 'See something in Safari? Tap Share. Done.',
    color: '#10b981',
    relatedIds: [7],
  },
]

export const FPS = 30
export const WIDTH = 1920
export const HEIGHT = 1080

// Scene timing (in seconds), converted to frames at runtime
export const TIMING = {
  INTRO_END: 2.5, // brand mark
  ORBIT_IN_END: 5, // orbit rings drawn, nodes placed
  NODES_PER_CYCLE: 8,
  SECONDS_PER_NODE: 2.5, // 8 × 2.5s = 20s of node highlights
  ALL_ACTIVE_END: 27, // 5 + 20 + 2s all-lit
  TOTAL: 28,
} as const

export const TOTAL_FRAMES = Math.round(TIMING.TOTAL * FPS)

// Orbit geometry (1920x1080 canvas)
export const ORBIT = {
  CX: 960,
  CY: 540,
  R: 340, // outer orbit radius
  NODE_SIZE: 96, // base node diameter
  CENTER_SIZE: 140,
} as const

// Node angular positions — 45° apart, starting at top (−90°), going clockwise
export function angleForNode(index: number): number {
  return -Math.PI / 2 + (index * 2 * Math.PI) / 8
}

export function nodePosition(
  index: number,
  rotation: number = 0,
): { x: number; y: number } {
  const a = angleForNode(index) + rotation
  return {
    x: ORBIT.CX + ORBIT.R * Math.cos(a),
    y: ORBIT.CY + ORBIT.R * Math.sin(a),
  }
}
