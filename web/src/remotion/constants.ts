// Steward explainer video — shared tokens + real data.
//
// Brand tokens mirror web/src/app/globals.css so the video reads like
// an extension of the landing page. Real watches are a snapshot from
// our production Supabase (anonymized — no user_ids, no URLs, just
// product/domain/status) pulled 2026-04-22.

// ---------- Brand tokens (from globals.css) ----------

export const COLORS = {
  bgDeep: '#080A08',
  bgCard: '#0F1211',
  bgElev: '#141816',
  forest: '#0F2018',
  mint: '#6EE7B7',
  mintDim: '#3DB88A',
  cream: '#F7F6F3',
  creamDim: 'rgba(247, 246, 243, 0.5)',
  creamFaint: 'rgba(247, 246, 243, 0.3)',
  border: 'rgba(255, 255, 255, 0.1)',
  borderBright: 'rgba(255, 255, 255, 0.22)',
  gold: '#F59E0B',
  goldLight: '#FEF3C7',
  red: '#EF4444',
  green: '#22C55E',
} as const

export const FONTS = {
  serif: '"Georgia", "Times New Roman", serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
} as const

// ---------- Video config ----------

export const FPS = 30
export const WIDTH = 1920
export const HEIGHT = 1080

// Six-scene explainer. Seconds → frames at render.
export const SCENES = {
  HOOK: { start: 0, dur: 3 }, // "Scalpers have bots. Now you have a concierge."
  SHARE: { start: 3, dur: 5 }, // Spot something → tap Share → pick Steward
  CHAT: { start: 8, dur: 5 }, // AI concierge creates the watch
  WATCHES: { start: 13, dur: 7 }, // Real watches from DB animate in as a grid
  NOTIFY: { start: 20, dur: 5 }, // Phone + push notification → tap to buy
  CTA: { start: 25, dur: 5 }, // "Get started for free"
} as const

export const TOTAL_SECONDS = 30
export const TOTAL_FRAMES = TOTAL_SECONDS * FPS

// ---------- Real watches (Supabase snapshot) ----------

export type WatchStatus = 'drop' | 'available' | 'watching'

export type RealWatch = {
  emoji: string
  name: string
  retailer: string // domain-ish
  status: WatchStatus
  wasPrice?: number
  nowPrice?: number
  targetPrice?: number
  note?: string
  accent?: string // override card accent color
}

// Hand-picked from `status IN ('watching','triggered')` for a diverse
// mix across verticals. Prices are real; retailer names are the actual
// source domain Steward monitored.
export const REAL_WATCHES: RealWatch[] = [
  {
    emoji: '🏷️',
    name: 'Nike Air Force 1',
    retailer: 'Best Price · eBay',
    status: 'drop',
    wasPrice: 100,
    nowPrice: 56,
    note: 'Price dropped across retailers',
    accent: COLORS.mint,
  },
  {
    emoji: '✈️',
    name: 'LAX → JFK · May 2',
    retailer: 'JetBlue',
    status: 'drop',
    wasPrice: 301.8,
    nowPrice: 276.8,
    note: 'Flight price dropped',
    accent: COLORS.mint,
  },
  {
    emoji: '📅',
    name: 'Silver Tip Campground',
    retailer: 'recreation.gov',
    status: 'available',
    note: 'Site 01 · Lake Alpine opened up',
    accent: COLORS.gold,
  },
  {
    emoji: '🍽️',
    name: 'Carbone NYC',
    retailer: 'resy.com',
    status: 'watching',
    note: '2 guests · May 3 · 8:30pm',
  },
  {
    emoji: '🧥',
    name: "Arc'teryx Beta SL Jacket",
    retailer: 'rei.com',
    status: 'watching',
    nowPrice: 299.83,
    note: 'Waiting for a drop',
  },
  {
    emoji: '👡',
    name: 'Birkenstock Franca',
    retailer: 'birkenstock.com',
    status: 'watching',
    nowPrice: 149.95,
    targetPrice: 120,
    note: 'Target: below $120',
  },
  {
    emoji: '💰',
    name: 'Vuori Halo Hoodie',
    retailer: 'rei.com',
    status: 'watching',
    nowPrice: 98,
    note: 'Any drop',
  },
  {
    emoji: '👜',
    name: 'Coach Tabby Shoulder Bag',
    retailer: 'coach.com',
    status: 'watching',
    nowPrice: 395,
    note: 'Any drop',
  },
  {
    emoji: '🧊',
    name: 'Coleman 35Qt Cooler',
    retailer: "dicks sporting goods",
    status: 'watching',
    nowPrice: 199.99,
    note: 'Any drop',
  },
]
